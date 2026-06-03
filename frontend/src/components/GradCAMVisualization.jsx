import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api/diagnosis/gradcam`;

function GradCAMVisualization() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gradcamUrl, setGradcamUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // lấy token từ localStorage (giống login của bạn)
  const token = localStorage.getItem("token");

  // chọn ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setGradcamUrl(null);
  };

  // gọi API GradCAM
  const handleGenerateGradCAM = async () => {
    if (!image) {
      alert("Vui lòng chọn ảnh trước!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", image);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("GradCAM API error");
      }

      // nhận ảnh dạng blob
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGradcamUrl(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Không tạo được GradCAM 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mt: 4,
        textAlign: "center",
        borderRadius: 3,
      }}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        🔥 Grad-CAM Visualization
      </Typography>

      {/* chọn ảnh */}
      <Button variant="contained" component="label">
        Chọn ảnh X-ray
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
      </Button>

      {/* preview ảnh gốc */}
      {preview && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Ảnh gốc</Typography>
          <img
            src={preview}
            alt="preview"
            style={{
              width: 300,
              borderRadius: 10,
              marginTop: 10,
            }}
          />
        </Box>
      )}

      {/* nút generate */}
      {image && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGenerateGradCAM}
            disabled={loading}
          >
            Tạo GradCAM
          </Button>
        </Box>
      )}

      {/* loading */}
      {loading && (
        <Box sx={{ mt: 3 }}>
          <CircularProgress />
          <Typography>Đang tạo GradCAM...</Typography>
        </Box>
      )}

      {/* hiển thị ảnh gradcam */}
      {gradcamUrl && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Kết quả GradCAM</Typography>
          <img
            src={gradcamUrl}
            alt="gradcam"
            style={{
              width: 300,
              borderRadius: 10,
              marginTop: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

export default GradCAMVisualization;