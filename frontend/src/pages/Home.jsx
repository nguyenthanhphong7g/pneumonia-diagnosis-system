import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Typography, Box, Button, CardMedia, CircularProgress,
  Alert, Grid, Divider, Paper, Fade, Stack, LinearProgress, Container
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  History as HistoryIcon,
  AutoFixHigh as MagicIcon,
  RestartAlt as RestartIcon
} from '@mui/icons-material';

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handlePredict = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post('http://localhost:8080/api/diagnosis/predict', formData);
      setTimeout(() => {
        setResult(res.data);
        setLoading(false);
        // Cuộn xuống phần kết quả một cách mượt mà
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 1500);
    } catch (err) {
      setError('Lỗi kết nối máy chủ phân tích.');
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* 1. HEADER LUÔN Ở GIỮA */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <MagicIcon sx={{ fontSize: 40, color: '#3b82f6', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
          Chẩn đoán Phổi AI
        </Typography>
        <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400 }}>
          Hệ thống phân tích hình ảnh X-quang chuẩn hóa quốc tế
        </Typography>
      </Box>

      {/* 2. KHU VỰC TẢI ẢNH CHÍNH (CANH GIỮA) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 800,
            borderRadius: 8,
            border: '2px dashed #e2e8f0',
            bgcolor: preview ? '#000' : '#f8fafc',
            overflow: 'hidden',
            transition: 'all 0.4s ease',
            position: 'relative', // Quan trọng: Để làm mốc cho các nút căn giữa bên trong
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!preview ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <input type="file" hidden id="file-input" onChange={handleFileChange} />
              <label htmlFor="file-input">
                <Box sx={{ cursor: 'pointer', '&:hover img': { transform: 'scale(1.1)' } }}>
                  <CloudUploadIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Tải lên hình ảnh X-quang</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>Click để duyệt tệp tin từ máy tính của bạn</Typography>
                  <Button variant="contained" component="span" size="large" sx={{ borderRadius: 3, px: 6, py: 1.5, fontWeight: 700 }}>
                    Chọn tệp ngay
                  </Button>
                </Box>
              </label>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', bgcolor: '#000' }}>
              <CardMedia
                component="img"
                image={preview}
                sx={{
                  maxHeight: 600,
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: (loading || (!result && preview)) ? 0.6 : 1, // Làm mờ nhẹ ảnh khi chưa chẩn đoán để nổi bật nút
                  transition: '0.3s'
                }}
              />

              {/* --- PHẦN NÚT ĐIỀU KHIỂN NẰM TRONG KHUNG ẢNH --- */}
              {preview && !result && !loading && (
                <Fade in={true}>
                  <Stack
                    direction="column" // Chuyển sang cột để căn giữa chuẩn hơn trong khung ảnh
                    spacing={2}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)', // Kỹ thuật căn giữa tuyệt đối
                      zIndex: 10,
                      width: '100%',
                      alignItems: 'center'
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handlePredict}
                      startIcon={<MagicIcon />}
                      sx={{
                        px: 6,
                        py: 2,
                        borderRadius: 4,
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      BẮT ĐẦU CHẨN ĐOÁN
                    </Button>

                    <Button
                      variant="text"
                      onClick={reset}
                      sx={{
                        color: '#fff',
                        textTransform: 'none',
                        textDecoration: 'underline',
                        '&:hover': { color: '#cbd5e1' }
                      }}
                    >
                      Chọn ảnh khác
                    </Button>
                  </Stack>
                </Fade>
              )}

              {/* LOADING TRẠNG THÁI */}
              {loading && (
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  zIndex: 11
                }}>
                  <CircularProgress color="inherit" size={60} thickness={2} />
                  <Typography sx={{ mt: 2, fontWeight: 700, letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    AI ĐANG PHÂN TÍCH...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Box>


      {/* 4. KẾT QUẢ HIỆN RA TRANG TRỌNG Ở DƯỚI */}
      {result && (
        <Fade in={true} timeout={1000}>
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 5, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Box sx={{
                    display: 'inline-flex', p: 3, borderRadius: '50%',
                    bgcolor: result.label === "Pneumonia" ? '#fef2f2' : '#f0fdf4',
                    mb: 2
                  }}>
                    {result.label === "Pneumonia" ?
                      <WarningIcon sx={{ fontSize: 60, color: '#ef4444' }} /> :
                      <CheckCircleIcon sx={{ fontSize: 60, color: '#22c55e' }} />
                    }
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                    {result.label === "Pneumonia" ? "VIÊM PHỔI" : "BÌNH THƯỜNG"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Mức độ tin cậy của AI</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{(result.confidence * 100).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={result.confidence * 100}
                      sx={{
                        height: 12, borderRadius: 6, bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { bgcolor: result.label === "Pneumonia" ? '#ef4444' : '#22c55e' }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>Khuyến cáo y tế:</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                      {result.label === "Pneumonia" ? (
                        <Box component="span" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                          ⚠️ Hệ thống phát hiện các dấu hiệu mờ đục trong nhu mô phổi. Cần thực hiện thêm xét nghiệm lâm sàng và liên hệ bác sĩ chuyên khoa ngay lập tức.
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: '#15803d' }}>
                          ✅ Hình ảnh cho thấy phổi hoạt động bình thường. Tiếp tục duy trì lối sống lành mạnh và kiểm tra sức khỏe định kỳ.
                        </Box>
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Button
                fullWidth
                startIcon={<RestartIcon />}
                onClick={reset}
                sx={{ mt: 4, py: 2, borderRadius: 4, fontWeight: 700, bgcolor: '#f8fafc' }}
              >
                Thực hiện phân tích mới
              </Button>
            </Paper>
          </Box>
        </Fade>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 4, maxWidth: 800, mx: 'auto', borderRadius: 4 }}>{error}</Alert>
      )}
    </Container>
  );
}

export default Home;