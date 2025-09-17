// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod types;
mod utils;

use utils::extract_audio;

use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize)]
struct ProcessResult {
    success: bool,
    message: String,
}

use crate::utils::slice_to_ts;
use crate::utils::slice_video;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            extract_audio,
            slice_to_ts,
            slice_video,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
