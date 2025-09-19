use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ProgressUpdate {
    pub progress: f32,
    pub message: String,
    pub task: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct VideoInfo {
    pub duration: f64,
    pub size: u64,
    pub format: String,
    pub resolution: String,
    pub bitrate: u64,
}
