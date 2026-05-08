import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Typography, Card, CardContent, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Box, Alert, CircularProgress, Grid, Dialog,
  DialogContent, Divider, Chip, Paper, LinearProgress, IconButton, Zoom, Fade
} from '@mui/material';

import {
  WarningAmber as WarningAmberIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  Close as CloseIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  RateReview as RateReviewIcon,
  LocalHospital as HospitalIcon,
  AutoAwesome as AiIcon
} from '@mui/icons-material';

import { AuthContext } from '../context/AuthContext';

function DoctorReview() {
  const { user } = useContext(AuthContext);
  const [pendingCases, setPendingCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [finalLabel, setFinalLabel] = useState("");
  const [doctorComment, setDoctorComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const fetchPending = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/review/pending');
      const data = res.data.data || res.data || [];
      setPendingCases(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage("Không thể tải danh sách");
      setMessageType("error");
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const getImagePath = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
    return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  const handleOpenReview = (caseData) => {
    setSelectedCase(caseData);
    setFinalLabel("");
    setDoctorComment("");
  };

  const handleCloseReview = () => setSelectedCase(null);

  const handleSubmitReview = async () => {
    if (!selectedCase || !finalLabel) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/review/submit', {
        diagnosisId: selectedCase.id,
        doctorId: Number(user.userId),
        finalLabel: finalLabel,
        doctorComment: doctorComment || ""
      });
      setMessage("Xác nhận thành công!");
      setMessageType("success");
      handleCloseReview();
      fetchPending();
    } catch (err) {
      setMessage("Lỗi khi lưu kết quả");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: { xs: 2, md: 8 } }}>
      
      {/* HEADER ĐÃ ĐƯỢC LÀM NỔI BẬT HƠN */}
      <Box sx={{ position: 'relative', mb: 6 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: '30px', 
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '1px solid #dbeafe',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Decor background */}
          <AiIcon sx={{ position: 'absolute', right: -20, top: -20, fontSize: 200, color: '#2563eb', opacity: 0.03 }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ bgcolor: '#2563eb', p: 1, borderRadius: '12px', display: 'flex' }}>
                <HospitalIcon sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 900, 
                color: '#1e293b',
                letterSpacing: '-1.5px'
              }}>
                Review <Box component="span" sx={{ color: '#2563eb' }}>Chuyên gia</Box>
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500, maxWidth: '550px', lineHeight: 1.5 }}>
              Hệ thống phê duyệt kết quả AI nhằm đảm bảo <Box component="span" sx={{ color: '#0f172a', fontWeight: 700, borderBottom: '2px solid #2563eb' }}>tính chính xác tuyệt đối</Box> trong chẩn đoán y khoa.
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right', minWidth: '150px' }}>
            <Typography variant="h2" sx={{ fontWeight: 950, color: '#2563eb', lineHeight: 0.8, mb: 1 }}>
              {pendingCases.length}
            </Typography>
            <Chip 
              label="Ca chờ duyệt" 
              sx={{ fontWeight: 800, bgcolor: '#dbeafe', color: '#1e40af', borderRadius: '8px' }} 
            />
          </Box>
        </Paper>
      </Box>

      {message && (
        <Alert severity={messageType} sx={{ mb: 4, borderRadius: '16px', fontWeight: 600 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {/* DANH SÁCH CA BỆNH */}
      {/* DANH SÁCH CA BỆNH */}
<Grid container spacing={4}>
  {pendingCases.map((item) => (
    // md={4} => 12/4 = 3 thẻ trên 1 hàng (Màn hình Desktop)
    // sm={6} => 12/6 = 2 thẻ trên 1 hàng (Màn hình Tablet)
    // xs={12} => 12/12 = 1 thẻ trên 1 hàng (Màn hình Mobile)
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Zoom in={true}>
        <Card sx={{ 
          borderRadius: '24px', 
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          height: '100%', // Đảm bảo các thẻ cao bằng nhau
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': { 
            transform: 'translateY(-12px)', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' 
          }
        }}>
          {/* Nội dung Card giữ nguyên như cũ của bạn */}
          <Box sx={{ height: 240, bgcolor: '#000', position: 'relative', overflow: 'hidden' }}>
            <img src={getImagePath(item.imagePath)} alt="X-ray" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <Box sx={{ position: 'absolute', top: 15, left: 15 }}>
              <Chip 
                label={item.label === "Pneumonia" ? "Cảnh báo Viêm phổi" : "Bình thường"} 
                color={item.label === "Pneumonia" ? "error" : "success"}
                sx={{ fontWeight: 800, backdropFilter: 'blur(8px)', bgcolor: item.label === "Pneumonia" ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)' }}
              />
            </Box>
          </Box>
          
          <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>Độ tin cậy của AI</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#2563eb' }}>{(item.confidence * 100).toFixed(1)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={item.confidence * 100} sx={{ height: 8, borderRadius: 5, bgcolor: '#f1f5f9' }} />
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              disableElevation
              startIcon={<RateReviewIcon />}
              onClick={() => handleOpenReview(item)}
              sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 800 }}
            >
              Mở ca chẩn đoán
            </Button>
          </CardContent>
        </Card>
      </Zoom>
    </Grid>
  ))}
</Grid>

      {/* REVIEW DIALOG - ĐÃ FIX LỖI WIDTH & KHOẢNG TRỐNG */}
      {/* REVIEW DIALOG - BỐ CỤC GỌN GÀNG, TỐI ƯU KHÔNG GIAN */}
      <Dialog
        open={!!selectedCase}
        onClose={handleCloseReview}
        maxWidth="lg" // Dùng size chuẩn của MUI để tự động căn chỉnh (khoảng 1200px)
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '16px', // Bo góc vừa phải, không bị lố
            overflow: 'hidden',
            maxHeight: '85vh' // Khống chế chiều cao không vượt quá màn hình
          } 
        }}
      >
        {selectedCase && (
          <Grid container>
            {/* VÙNG ẢNH CHIẾM 7 PHẦN */}
            <Grid item xs={12} md={7} sx={{ bgcolor: '#000', display: 'flex', p: 0 }}>
              <Box sx={{ width: '100%', height: '100%', minHeight: { xs: 300, md: 500 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={getImagePath(selectedCase.imagePath)}
                  alt="X-ray View"
                  style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }}
                />
              </Box>
            </Grid>

            {/* VÙNG FORM CHIẾM 5 PHẦN - Kéo giãn bề ngang để hết khoảng trắng */}
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
              <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header của form */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Xác nhận kết quả</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ID: #{selectedCase.id}</Typography>
                  </Box>
                  <IconButton onClick={handleCloseReview} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Khối AI Dự đoán - Giảm độ cao, làm gọn lại */}
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}> AI Dự đoán </Typography>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '12px', bgcolor: selectedCase.label === "Pneumonia" ? '#fff1f2' : '#f0fdf4', display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    bgcolor: selectedCase.label === "Pneumonia" ? '#fb7185' : '#4ade80', 
                    p: 0.8, borderRadius: '8px', display: 'flex' 
                  }}>
                    {selectedCase.label === "Pneumonia" ? 
                      <WarningAmberIcon sx={{ color: '#fff', fontSize: 20 }} /> : 
                      <CheckCircleOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
                    }
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: selectedCase.label === "Pneumonia" ? '#9f1239' : '#166534', lineHeight: 1.2 }}>
                      {selectedCase.label === "Pneumonia" ? "VIÊM PHỔI" : "BÌNH THƯỜNG"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedCase.label === "Pneumonia" ? '#e11d48' : '#15803d' }}>
                      Tin cậy: {(selectedCase.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Paper>

                <Divider sx={{ mb: 3 }} />

                {/* Các trường nhập liệu - Dùng fullWidth và flexGrow để lấp đầy đều khoảng trống */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontWeight: 600 }}>Kết luận từ Chuyên gia</InputLabel>
                    <Select
                      value={finalLabel}
                      onChange={(e) => setFinalLabel(e.target.value)}
                      label="Kết luận từ Chuyên gia"
                      sx={{ borderRadius: '10px', fontWeight: 600 }}
                    >
                      <MenuItem value="Pneumonia">Viêm phổi (Pneumonia)</MenuItem>
                      <MenuItem value="Normal">Bình thường (Normal)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Nhận xét lâm sàng"
                    placeholder="Nhập ghi chú tại đây..."
                    multiline
                    rows={4} // Đã giảm từ 7 xuống 4 để form bớt cồng kềnh
                    fullWidth
                    value={doctorComment}
                    onChange={(e) => setDoctorComment(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>

                {/* Cụm Nút bấm mới - Kéo dài fullwidth và thêm nút Hội chẩn */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="inherit"
                    sx={{ flex: 1, py: 1.5, borderRadius: '10px', fontWeight: 700, textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}
                  >
                    Yêu cầu Hội chẩn
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSubmitReview} 
                    disabled={loading || !finalLabel}
                    sx={{ 
                      flex: 1.5, 
                      py: 1.5, 
                      borderRadius: '10px', 
                      textTransform: 'none', 
                      fontWeight: 800,
                      boxShadow: 'none',
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Lưu & Hoàn tất"}
                  </Button>
                </Box>
                
              </Box>
            </Grid>
          </Grid>
        )}
      </Dialog>
    </Box>
  );
}

export default DoctorReview;