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
        console_log!("DocumentFormatter created");
        DocumentFormatter { config: None }
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config_js: &JsValue) -> Result<(), JsValue> {
        let config: ExamConfig = serde_wasm_bindgen::from_value(config_js.clone())?;
        console_log!("Setting configuration for exam: {}", config.name);
        self.config = Some(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn format_document(
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

        // Handle PDF files differently
        if original_name.to_lowercase().ends_with(".pdf") && format_config.format == "PDF" {
            console_log!("Processing PDF file: {}", original_name);
            return self.process_pdf(file_data, format_config);
        }
        // Load and process the image
        let img = image::load_from_memory(file_data)
            .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;

        console_log!("Original image dimensions: {}x{}", img.width(), img.height());
        // Resize the image
        let resized_img = img.resize_exact(
            format_config.width,
            format_config.height,
            image::imageops::FilterType::Lanczos3,
        );

        console_log!("Resized image to: {}x{}", format_config.width, format_config.height);
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

    fn process_pdf(&self, file_data: &[u8], format_config: &DocumentFormat) -> Result<Vec<u8>, JsValue> {
        console_log!("Processing PDF document");
        
        // For PDF files, we'll just check the size and return as-is if within limits
        // In a more advanced implementation, you could use a PDF library to resize/compress
        let target_size = format_config.max_size * 1024;
        
        if file_data.len() <= target_size as usize {
            console_log!("PDF size is within limits: {}KB", file_data.len() / 1024);
            Ok(file_data.to_vec())
        } else {
            console_log!("PDF too large: {}KB, target: {}KB", file_data.len() / 1024, format_config.max_size);
            Err(JsValue::from_str(&format!(
                "PDF file is too large ({}KB). Maximum allowed size is {}KB. Please compress the PDF manually.",
                file_data.len() / 1024,
                format_config.max_size
            )))
        }
    }
    fn compress_to_target_size(
        &self,
        img: &DynamicImage,
        target_size: usize,
        format: &str,
    ) -> Result<Vec<u8>, JsValue> {
        console_log!("Compressing image to target size: {}KB", target_size / 1024);
        
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

            console_log!("Compression attempt with quality {}: {}KB", quality, output_buffer.len() / 1024);
            if output_buffer.len() <= target_size || quality <= 10 {
                break;
            }

            quality = (quality as f32 * 0.9) as u8;
            if quality < 10 {
                quality = 10;
            }
        }

        console_log!("Final compressed size: {}KB with quality: {}", output_buffer.len() / 1024, quality);
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
                width: 600,
                height: 800,
                dpi: 200,
                format: "PDF".to_string(),
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
            "certificate".to_string(),
            "caste_certificate".to_string(),
            "income_certificate".to_string(),
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
            "aadhaar".to_string(),
        ],
    };

#[wasm_bindgen]
pub fn get_jee_config() -> JsValue {
    let config = ExamConfig {
        name: "JEE".to_string(),
        code: "jee".to_string(),
        formats: ExamFormats {
            photo: DocumentFormat {
                width: 240,
                height: 320,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 150,
            },
            signature: DocumentFormat {
                width: 240,
                height: 80,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 40,
            },
            documents: DocumentFormat {
                width: 600,
                height: 800,
                dpi: 150,
                format: "JPEG".to_string(),
                quality: 75,
                max_size: 400,
            },
        },
        max_file_size: 1536,
        allowed_formats: vec!["image/jpeg".to_string(), "image/png".to_string()],
        document_types: vec![
            "photo".to_string(),
            "signature".to_string(),
            "class10_certificate".to_string(),
            "class12_certificate".to_string(),
            "aadhaar".to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn get_cat_config() -> JsValue {
    let config = ExamConfig {
        name: "CAT".to_string(),
        code: "cat".to_string(),
        formats: ExamFormats {
            photo: DocumentFormat {
                width: 200,
                height: 240,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 85,
                max_size: 120,
            },
            signature: DocumentFormat {
                width: 200,
                height: 60,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 85,
                max_size: 25,
            },
            documents: DocumentFormat {
                width: 700,
                height: 900,
                dpi: 200,
                format: "PDF".to_string(),
                quality: 80,
                max_size: 600,
            },
        },
        max_file_size: 2048,
        allowed_formats: vec!["image/jpeg".to_string(), "image/png".to_string(), "application/pdf".to_string()],
        document_types: vec![
            "photo".to_string(),
            "signature".to_string(),
            "graduation_certificate".to_string(),
            "aadhaar".to_string(),
            "category_certificate".to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn get_gate_config() -> JsValue {
    let config = ExamConfig {
        name: "GATE".to_string(),
        code: "gate".to_string(),
        formats: ExamFormats {
            photo: DocumentFormat {
                width: 240,
                height: 320,
                dpi: 200,
                format: "JPEG".to_string(),
                quality: 80,
                max_size: 100,
            },
            signature: DocumentFormat {
                width: 240,
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
                max_size: 350,
            },
        },
        max_file_size: 1024,
        allowed_formats: vec!["image/jpeg".to_string(), "image/png".to_string()],
        document_types: vec![
            "photo".to_string(),
            "signature".to_string(),
            "graduation_certificate".to_string(),
            "aadhaar".to_string(),
        ],
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}
    serde_wasm_bindgen::to_value(&config).unwrap()
}