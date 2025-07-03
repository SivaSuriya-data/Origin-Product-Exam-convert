use wasm_bindgen::prelude::*;
use web_sys::console;
use image::{ImageFormat, DynamicImage, ImageOutputFormat};
use std::io::Cursor;
use serde::{Deserialize, Serialize};

// Import the `console.log` function from the browser
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for easier console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize)]
pub struct DocumentFormat {
    width: u32,
    height: u32,
    dpi: u32,
    format: String,
    quality: u8,
    max_size: u32,
}

#[derive(Serialize, Deserialize)]
pub struct ExamConfig {
    name: String,
    code: String,
    formats: ExamFormats,
    max_file_size: u32,
    allowed_formats: Vec<String>,
    document_types: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ExamFormats {
    photo: DocumentFormat,
    signature: DocumentFormat,
    documents: DocumentFormat,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessingOptions {
    exam_config: ExamConfig,
    document_type: String,
    target_size_kb: Option<u32>,
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct DocumentFormatter {
    config: Option<ExamConfig>,
}

#[wasm_bindgen]
impl DocumentFormatter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DocumentFormatter {
        init_panic_hook();
        DocumentFormatter { config: None }
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config_js: &JsValue) -> Result<(), JsValue> {
        let config: ExamConfig = serde_wasm_bindgen::from_value(config_js.clone())?;
        self.config = Some(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub async fn format_document(
        &self,
        file_data: &[u8],
        document_type: &str,
        original_name: &str,
    ) -> Result<Vec<u8>, JsValue> {
        console_log!("Starting document formatting for type: {}", document_type);

        let config = self.config.as_ref()
            .ok_or_else(|| JsValue::from_str("Configuration not set"))?;

        // Determine which format to use based on document type
        let format_config = match document_type {
            "photo" => &config.formats.photo,
            "signature" => &config.formats.signature,
            _ => &config.formats.documents,
        };

        console_log!("Using format config: {}x{} at {} DPI", 
                    format_config.width, format_config.height, format_config.dpi);

        // Load and process the image
        let img = image::load_from_memory(file_data)
            .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;

        // Resize the image
        let resized_img = img.resize_exact(
            format_config.width,
            format_config.height,
            image::imageops::FilterType::Lanczos3,
        );

        // Convert to the target format and compress
        let output_format = match format_config.format.as_str() {
            "JPEG" => ImageOutputFormat::Jpeg(format_config.quality),
            "PNG" => ImageOutputFormat::Png,
            _ => ImageOutputFormat::Jpeg(format_config.quality),
        };

        let mut output_buffer = Vec::new();
        let mut cursor = Cursor::new(&mut output_buffer);
        
        resized_img.write_to(&mut cursor, output_format)
            .map_err(|e| JsValue::from_str(&format!("Failed to encode image: {}", e)))?;

        // Check if we need to compress further to meet size requirements
        let target_size = format_config.max_size * 1024; // Convert KB to bytes
        if output_buffer.len() > target_size as usize {
            console_log!("File too large ({}KB), compressing further", output_buffer.len() / 1024);
            output_buffer = self.compress_to_target_size(
                &resized_img,
                target_size as usize,
                &format_config.format,
            )?;
        }

        console_log!("Document formatted successfully. Final size: {}KB", output_buffer.len() / 1024);
        Ok(output_buffer)
    }

    fn compress_to_target_size(
        &self,
        img: &DynamicImage,
        target_size: usize,
        format: &str,
    ) -> Result<Vec<u8>, JsValue> {
        let mut quality = 95u8;
        let mut output_buffer;

        loop {
            output_buffer = Vec::new();
            let mut cursor = Cursor::new(&mut output_buffer);
            
            let output_format = match format {
                "JPEG" => ImageOutputFormat::Jpeg(quality),
                "PNG" => ImageOutputFormat::Png,
                _ => ImageOutputFormat::Jpeg(quality),
            };

            img.write_to(&mut cursor, output_format)
                .map_err(|e| JsValue::from_str(&format!("Failed to encode image: {}", e)))?;

            if output_buffer.len() <= target_size || quality <= 10 {
                break;
            }

            quality = (quality as f32 * 0.9) as u8;
            if quality < 10 {
                quality = 10;
            }
        }

        Ok(output_buffer)
    }
}

// Utility functions for different exam types
#[wasm_bindgen]
pub fn get_upsc_config() -> JsValue {
    let config = ExamConfig {
        name: "UPSC".to_string(),
        code: "upsc".to_string(),
        formats: ExamFormats {
            photo: DocumentFormat {
                width: 300,
                height: 400,
                dpi: 300,
                format: "JPEG".to_string(),
                quality: 85,
                max_size: 200,
            },
            signature: DocumentFormat {
                width: 300,
                height: 100,
                dpi: 300,
                format: "JPEG".to_string(),
                quality: 85,
                max_size: 50,
            },
            documents: DocumentFormat {
                width: 800,
                height: 1200,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 500,
            },
        },
        max_file_size: 2048,
        allowed_formats: vec!["image/jpeg".to_string(), "image/png".to_string()],
        document_types: vec![
            "photo".to_string(),
            "signature".to_string(),
            "aadhaar".to_string(),
            "marksheet".to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn get_neet_config() -> JsValue {
    let config = ExamConfig {
        name: "NEET".to_string(),
        code: "neet".to_string(),
        formats: ExamFormats {
            photo: DocumentFormat {
                width: 200,
                height: 230,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 100,
            },
            signature: DocumentFormat {
                width: 200,
                height: 80,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 30,
            },
            documents: DocumentFormat {
                width: 600,
                height: 800,
                dpi: 150,
                format: "JPEG".to_string(),
                quality: 75,
                max_size: 300,
            },
        },
        max_file_size: 1024,
        allowed_formats: vec!["image/jpeg".to_string(), "image/png".to_string()],
        document_types: vec![
            "photo".to_string(),
            "signature".to_string(),
            "class10_marksheet".to_string(),
            "class12_marksheet".to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}