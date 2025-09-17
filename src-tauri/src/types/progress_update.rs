use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ProgressUpdate {
    pub progress: f32,
    pub message: String,
    pub task: Option<String>,
}
