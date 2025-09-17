use mp4::Mp4Reader;
use regex::Regex;
use shared_child::SharedChild;
use tauri::Emitter;

use crate::{types::ProgressUpdate, ProcessResult};
use std::{
    env,
    fs::File,
    io::{BufRead, BufReader},
    os::windows::process::CommandExt,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{Arc, Mutex},
};
fn get_resource_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    // 在开发环境中，资源目录是项目根目录
    // 在生产环境中，资源目录是应用可执行文件所在目录
    let exe_dir = env::current_exe()?
        .parent()
        .ok_or("无法获取可执行文件目录")?
        .to_path_buf();

    // 检查是否是开发环境 (通过检查是否存在 Cargo.toml)
    let cargo_toml_path = exe_dir.join("Cargo.toml");
    if cargo_toml_path.exists() {
        // 开发环境 - 资源目录是 src-tauri
        Ok(exe_dir)
    } else {
        // 生产环境 - 资源目录是可执行文件所在目录
        Ok(exe_dir)
    }
}

pub fn get_embedded_ffmpeg_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    // 获取应用资源目录
    let resource_path = get_resource_dir()?;

    // 根据平台确定 FFmpeg 二进制文件路径
    #[cfg(target_os = "windows")]
    let ffmpeg_path = resource_path.join("bin/windows/ffmpeg.exe");
    let ffprobe_path = resource_path.join("bin/windows/ffprobe.exe");

    #[cfg(target_os = "macos")]
    let ffmpeg_path = resource_path.join("bin/macos/ffmpeg");

    #[cfg(target_os = "linux")]
    let ffmpeg_path = resource_path.join("bin/linux/ffmpeg");

    if ffmpeg_path.exists() {
        Ok(ffmpeg_path)
    } else {
        Err("嵌入的 FFmpeg 未找到".into())
    }
}

#[tauri::command]
pub async fn extract_audio(
    input_path: String,
    output_path: String,
    app_handle: tauri::AppHandle,
) -> Result<ProcessResult, String> {
    // 获取嵌入的 FFmpeg 路径
    let ffmpeg_path = get_embedded_ffmpeg_path().map_err(|e| e.to_string())?;
    // 创建进度共享状态
    let progress = Arc::new(Mutex::new(0.0));
    let progress_clone = Arc::clone(&progress);
    println!("FFmpeg 路径: {:?}", ffmpeg_path);

    // 发射初始进度事件
    app_handle
        .emit(
            "ffmpeg-progress",
            ProgressUpdate {
                progress: 0.0,
                message: "开始提取音频...".to_string(),
                task: None,
            },
        )
        .map_err(|e| format!("无法发送进度事件: {}", e))?;
    println!("提取音频: {} -> {}", input_path, output_path);
    // 获取视频总时长（用于计算进度）
    let video_duration = get_video_duration(&input_path).await?;

    println!("视频时长: {}", video_duration);
    // 构建 FFmpeg 命令
    let mut cmd = Command::new(&ffmpeg_path);
    cmd.args(&[
        "-i",
        &input_path,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
        &output_path,
        "-y",
        "-progress",
        "pipe:1", // 强制进度输出到标准输出
        "-loglevel",
        "info",   // 设置日志级别
        "-stats", // 显示统计信息
    ])
    .stdout(Stdio::piped()) // 重定向 stderr 以便读取进度
    .stderr(Stdio::piped()); // 重定向标准错误以读取错误信息
    println!("FFmpeg 命令: {:?}", cmd);
    // 启动 FFmpeg 进程
    let app_handle_clone = app_handle.clone();
    // let mut child = cmd.spawn().map_err(|e| format!("无法启动 FFmpeg: {}", e))?;
    match SharedChild::spawn(&mut cmd) {
        Ok(child) => tokio::spawn(async move {
            if let Some(stdout) = child.take_stdout() {
                let mut reader = BufReader::new(stdout);
                loop {
                    let mut buf: Vec<u8> = Vec::new();
                    match tauri::utils::io::read_line(&mut reader, &mut buf) {
                        Ok(n) => {
                            if n == 0 {
                                break;
                            }
                            if let Ok(output) = std::str::from_utf8(&buf) {
                                let re = Regex::new("out_time=(?<out_time>.*?)\\n").unwrap();
                                if let Some(cap) = re.captures(output) {
                                    let out_time = &cap["out_time"];
                                    if !out_time.is_empty() {
                                        println!("out_time: {}", out_time);
                                        let current_time = parse_time_to_seconds(out_time);
                                        println!("current_time: {:?}", current_time);
                                        let progress =
                                            (current_time.unwrap() / video_duration) * 100.0;
                                        let formatted_num = format!("{:.2}", progress);
                                        println!("进度: {}", formatted_num);
                                        let _ = app_handle_clone
                                            .emit(
                                                "ffmpeg-progress",
                                                ProgressUpdate {
                                                    progress: formatted_num.parse().unwrap(),
                                                    message: "正在提取音频...".to_string(),
                                                    task: None,
                                                },
                                            )
                                            .map_err(|e| format!("无法发送进度事件: {}", e));
                                        // tx.try_send(String::from(out_time)).ok();
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            eprintln!("Error: Failed to read progress from ffmpeg");
                        }
                    }
                }
            }
            if child.wait().is_ok() {
                println!("完成");
                let _ = app_handle_clone
                    .emit(
                        "ffmpeg-progress",
                        ProgressUpdate {
                            progress: 100.0,
                            message: "音频提取完成!".to_string(),
                            task: None,
                        },
                    )
                    .map_err(|e| format!("无法发送完成事件: {}", e));

                println!("ffmpeg process completed");
                0
            } else {
                println!("ffmpeg process failed");
                1
            }
        }),
        Err(e) => {
            return Err(format!("无法启动 FFmpeg: {}", e));
        }
    };

    Ok(ProcessResult {
        success: true,
        message: format!("音频已提取到: {}", output_path),
    })
}

async fn get_video_duration(input_path: &str) -> Result<f64, String> {
    let file = File::open(&input_path).unwrap();
    let size = file.metadata().map_err(|e| e.to_string())?.len();
    let reader = BufReader::new(file);
    let mp4 = Mp4Reader::read_header(reader, size).map_err(|e| e.to_string())?; // 0 = 不扫描 mdat
    let video_duration = mp4.duration().as_secs_f64() as f64;
    println!("duration: {:?}", video_duration);

    Ok(video_duration)
}

fn parse_time_to_seconds(time_str: &str) -> Option<f64> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 3 {
        return None;
    }

    let hours = parts[0].parse::<f64>().ok()?;
    let minutes = parts[1].parse::<f64>().ok()?;
    let seconds = parts[2].parse::<f64>().ok()?;

    Some(hours * 3600.0 + minutes * 60.0 + seconds)
}

// 获取视频总时长
#[tauri::command]
pub async fn slice_to_ts(input_path: String, output_path: String) -> Result<ProcessResult, String> {
    // 获取嵌入的 FFmpeg 路径
    let ffmpeg_path = get_embedded_ffmpeg_path().map_err(|e| e.to_string())?;
    // 构建 FFmpeg 命令进行视频切片
    let output = Command::new(ffmpeg_path)
        .args(&[
            "-i",
            &input_path,
            "-c",
            "copy", // 直接复制流，不重新编码
            "-bsf:v",
            "h264_mp4toannexb", // 转换 H.264 比特流格式
            "-f",
            "segment", // 分段输出
            "-segment_time",
            "100", // 每段10秒
            "-segment_format",
            "mpegts", // TS格式
            &output_path,
            "-y", // 覆盖输出文件
        ])
        .output()
        .map_err(|e| format!("执行失败: {}", e))?;

    if output.status.success() {
        Ok(ProcessResult {
            success: true,
            message: format!("视频已切片到: {}", output_path),
        })
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("FFmpeg 错误: {}", error_msg))
    }
}
#[tauri::command]
pub async fn slice_video(
    input_path: String,
    output_dir: String,
    duration: u32, // 秒
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    std::fs::create_dir_all(&output_dir).map_err(|e| format!("创建输出目录失败: {}", e))?;
    let video_duration = get_video_duration(&input_path).await?;
    let segment_name = "segment_%03d.ts";
    let playlist = Path::new(&output_dir).join("index.m3u8");
    let segment_path = Path::new(&output_dir).join(segment_name);
    let ffmpeg_path = get_embedded_ffmpeg_path().map_err(|e| e.to_string())?;
    let mut cmd = Command::new(ffmpeg_path);
    cmd.args(&[
        "-i",
        &input_path,
        // 视频：h264  baseline 4.1  （兼容性最好）
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-profile:v",
        "baseline",
        "-level",
        "4.1",
        // 音频：aac
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-b:a",
        "128k",
        // 关键帧对齐，必须
        "-force_key_frames",
        &format!("expr:gte(t,n_forced*{})", duration),
        // 切片参数
        "-f",
        "segment",
        "-segment_time",
        &duration.to_string(),
        "-segment_format",
        "mpegts",
        "-segment_list_type",
        "m3u8",
        "-segment_list",
        playlist.to_str().unwrap(),
        "-segment_list_flags",
        "+live", // 允许后续追加
        "-segment_wrap",
        "0", // 序号不循环
        "-progress",
        "pipe:1", // 进度依旧走 stdout
        segment_path.to_str().unwrap(),
    ])
    .creation_flags(0x08000000) // 隐藏窗口
    .stdout(Stdio::piped()) // 重定向 stderr 以便读取进度
    .stderr(Stdio::null()); // 重定向标准错误以读取错误信息
    println!("{:?}", cmd);
    // 启动 FFmpeg 进程
    let app_handle_clone = app_handle.clone();
    // let mut child = cmd.spawn().map_err(|e| format!("无法启动 FFmpeg: {}", e))?;
    match SharedChild::spawn(&mut cmd) {
        Ok(child) => tokio::spawn(async move {
            println!("FFmpeg 进程已启动");
            if let Some(stdout) = child.take_stdout() {
                let mut reader = BufReader::new(stdout);
                loop {
                    let mut buf: Vec<u8> = Vec::new();
                    match tauri::utils::io::read_line(&mut reader, &mut buf) {
                        Ok(n) => {
                            if n == 0 {
                                break;
                            }
                            // println!("--------{}", String::from_utf8_lossy(&buf));
                            if let Ok(output) = std::str::from_utf8(&buf) {
                                let re = Regex::new("time=(?<out_time>.*?)\\n").unwrap();
                                if let Some(cap) = re.captures(output) {
                                    println!("time: {:?}", &cap);
                                    let out_time = &cap["out_time"];
                                    if !out_time.is_empty() {
                                        println!("time: {}", out_time);
                                        let current_time = parse_time_to_seconds(out_time);
                                        println!("current_time: {:?}", current_time);
                                        let progress =
                                            (current_time.unwrap() / video_duration) * 100.0;
                                        let formatted_num = format!("{:.2}", progress);
                                        println!("进度: {}", formatted_num);
                                        let _ = app_handle_clone
                                            .emit(
                                                "ffmpeg-progress",
                                                ProgressUpdate {
                                                    progress: formatted_num.parse().unwrap(),
                                                    message: "正在提取音频...".to_string(),
                                                    task: Some("slice".to_string()),
                                                },
                                            )
                                            .map_err(|e| format!("无法发送进度事件: {}", e));
                                        // tx.try_send(String::from(out_time)).ok();
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            eprintln!("Error: Failed to read progress from ffmpeg");
                        }
                    }
                }
            }
            if let Some(stderr) = child.take_stderr() {
                tokio::spawn(async move {
                    let reader = BufReader::new(stderr);
                    let lines = reader.lines();
                    println!("lines{:?}", lines);
                });
            }
        }),
        Err(e) => {
            return Err(format!("无法启动 FFmpeg: {}", e));
        }
    };

    Ok(())
}
