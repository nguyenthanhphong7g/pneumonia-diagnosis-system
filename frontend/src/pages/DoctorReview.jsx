import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Typography, Card, CardContent, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Box, CircularProgress, Grid, Dialog,
  DialogContent, Divider, Chip, Paper, LinearProgress, IconButton, Zoom, Fade,
  InputAdornment
} from '@mui/material';

import {
  WarningAmber as WarningAmberIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  Close as CloseIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  RateReview as RateReviewIcon,
  LocalHospital as HospitalIcon,
  AutoAwesome as AiIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import { AuthContext } from '../context/AuthContext';
import { apiUrl } from '../config/api';
import ToastNotification from '../components/ToastNotification';
import DiagnosisMediaViewer from '../components/DiagnosisMediaViewer';
import { formatModelName, resolveModelName } from '../utils/diagnosisDisplay';

function DoctorReview() {
  const { user } = useContext(AuthContext);
  const [pendingCases, setPendingCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [finalLabel, setFinalLabel] = useState("");
  const [doctorComment, setDoctorComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLabel, setFilterLabel] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const fetchPending = async () => {
    try {
      const res = await axios.get(apiUrl('/api/review/pending'));
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
    return apiUrl(path);
  };

  const getModelName = (record) => formatModelName(resolveModelName(record?.modelName, record?.model, record?.aiModel, record?.model_name));

  const handleOpenReview = (caseData) => {
    setSelectedCase(caseData);
    setFinalLabel("");
    setDoctorComment("");
  };

  const filteredCases = pendingCases.filter(item => {
    const matchesSearch = item.id?.toString().includes(searchTerm) ||
      item.label?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLabel = filterLabel === 'all' || item.label?.toLowerCase() === filterLabel.toLowerCase();

    // Lọc theo Model
    const modelName = getModelName(item).toLowerCase();
    const matchesModel = filterModel === 'all' || modelName.includes(filterModel.toLowerCase());

    // Lọc theo Ngày (YYYY-MM-DD)
    const matchesDate = !filterDate || (item.createdAt && item.createdAt.startsWith(filterDate));

    return matchesSearch && matchesLabel && matchesModel && matchesDate;
  });

  const handleCloseReview = () => setSelectedCase(null);

  const handleSubmitReview = async () => {
    if (!selectedCase || !finalLabel) return;
    setLoading(true);
    try {
      await axios.post(apiUrl('/api/review/submit'), {
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
            p: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: { xs: '20px', md: '30px' },
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '1px solid #dbeafe',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
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

          <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { xs: 'auto', md: '150px' } }}>
            <Typography variant="h2" sx={{ fontWeight: 950, color: '#2563eb', lineHeight: 0.8, mb: 1 }}>
              {filteredCases.length}
            </Typography>
            <Chip
              label="Kết quả tìm thấy"
              sx={{ fontWeight: 800, bgcolor: '#dbeafe', color: '#1e40af', borderRadius: '8px' }}
            />
          </Box>
        </Paper>
      </Box>

      <ToastNotification
        open={Boolean(message)}
        message={message}
        severity={messageType}
        onClose={() => setMessage("")}
      />

      {/* SEARCH AND FILTER */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          background: '#fff'
        }}
      >
        <TextField
          fullWidth
          placeholder="Tìm kiếm mã ID hoặc kết quả AI..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#f8fafc'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
          <Select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
          >
            <MenuItem value="all">Tất cả AI Label</MenuItem>
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="Pneumonia">Pneumonia</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
          <Select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
          >
            <MenuItem value="all">Mọi Model</MenuItem>
            <MenuItem value="DenseNet">DenseNet169</MenuItem>
            <MenuItem value="Fusion">Gated Fusion</MenuItem>
            <MenuItem value="ViT">Vision Transformer (ViT)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          type="date"
          size="small"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          sx={{
            minWidth: { xs: '100%', md: 160 },
            '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' }
          }}
          InputLabelProps={{ shrink: true }}
        />
      </Paper>

      {/* DANH SÁCH CA BỆNH */}
      {/* DANH SÁCH CA BỆNH */}
      {filteredCases.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '30px', bgcolor: 'rgba(255,255,255,0.5)', border: '2px dashed #e2e8f0' }}>
          <AiIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 700 }}>
            Không tìm thấy ca bệnh nào
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Hiện tại không có ca bệnh nào cần review hoặc không khớp với tìm kiếm của bạn.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {filteredCases.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id} sx={{ display: 'flex' }}>
              <Zoom in={true}>
                <Card
                  sx={{
                    width: '100%',
                    // CỐ ĐỊNH CHIỀU CAO THẺ: Đảm bảo mọi thẻ cao bằng nhau dù nội dung dài ngắn
                    height: 460,
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  {/* VÙNG ẢNH CỐ ĐỊNH CHIỀU CAO */}
                  {/* Vùng chứa ảnh: Cố định kích thước */}
                  <Box
                    sx={{
                      height: 220,
                      width: '100%',
                      bgcolor: '#000',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',          // Thêm flex để căn giữa ảnh
                      justifyContent: 'center', // Căn giữa theo chiều ngang
                      alignItems: 'center',     // Căn giữa theo chiều dọc
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={getImagePath(item.imagePath)}
                      alt="X-ray"
                      style={{
                        width: '300px',         // Ép chiều ngang cứng 300px
                        height: '100%',         // Chiều cao tự động lấp đầy box (hoặc chỉnh lại theo ý bạn)
                        objectFit: 'cover',     // Giúp ảnh luôn đẹp dù bị cắt
                        objectPosition: 'center',
                      }}
                    />

                    {/* Chip trạng thái vẫn giữ nguyên */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                      <Chip
                        label={item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                        color={item.label === 'Pneumonia' ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 800, backdropFilter: 'blur(4px)' }}
                      />
                    </Box>
                  </Box>

                  {/* NỘI DUNG THẺ */}
                  <CardContent
                    sx={{
                      p: 3,
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Phần thông số */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>
                          Độ tin cậy AI
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#2563eb' }}>
                          {(item.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.confidence * 100}
                        sx={{ height: 6, borderRadius: 5, bgcolor: '#f1f5f9' }}
                      />
                    </Box>

                    <Chip
                      label={`Model: ${getModelName(item)}`}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 700, borderStyle: 'dashed', width: 'fit-content', mb: 1.5 }}
                    />

                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      ID: #{item.id.toString().slice(-6).toUpperCase()}
                    </Typography>

                    {/* NÚT BẤM: Luôn nằm ở đáy thẻ nhờ margin-top: auto */}
                    <Button
                      variant="contained"
                      fullWidth
                      disableElevation
                      startIcon={<RateReviewIcon />}
                      onClick={() => handleOpenReview(item)}
                      sx={{
                        mt: 'auto',
                        borderRadius: '12px',
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: '#2563eb',
                      }}
                    >
                      Mở ca chẩn đoán
                    </Button>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* REVIEW DIALOG - BỐ CỤC 60/40 CỐ ĐỊNH */}
      <Dialog
        open={!!selectedCase}
        onClose={handleCloseReview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            maxHeight: '90vh',
            bgcolor: '#000'
          }
        }}
      >
        {selectedCase && (
          <Box sx={{ position: 'relative', width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
            {/* VÙNG ẢNH CHIẾM 60% */}
            <Box sx={{ width: { xs: '100%', md: '60%' }, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: '100%' }}>
                <DiagnosisMediaViewer
                  originalSrc={getImagePath(selectedCase.imagePath)}
                  gradcamSrc={selectedCase.gradcamPath ? apiUrl(selectedCase.gradcamPath) : null}
                  height="auto"
                />
              </Box>
            </Box>

            {/* VÙNG FORM CHIẾM 40% */}
            <Box sx={{
              width: { xs: '100%', md: '40%' },
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #e2e8f0'
            }}>
              <Box sx={{ p: { xs: 3, md: 4 }, flexGrow: 1, overflowY: 'auto', maxHeight: '85vh' }}>
                {/* Header của form */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>Xác nhận kết quả</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ID: #{selectedCase.id}</Typography>
                  </Box>
                  <IconButton onClick={handleCloseReview} size="small" sx={{ bgcolor: '#f1f5f9' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Khối AI Dự đoán */}
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}> AI Dự đoán </Typography>
                <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: selectedCase.label === "Pneumonia" ? '#fff1f2' : '#f0fdf4', display: 'flex', alignItems: 'center', gap: 2, mb: 3, border: '1px solid', borderColor: selectedCase.label === "Pneumonia" ? '#fecdd3' : '#bbf7d0' }}>
                  <Box sx={{
                    bgcolor: selectedCase.label === "Pneumonia" ? '#fb7185' : '#4ade80',
                    p: 1, borderRadius: '10px', display: 'flex'
                  }}>
                    {selectedCase.label === "Pneumonia" ?
                      <WarningAmberIcon sx={{ color: '#fff', fontSize: 24 }} /> :
                      <CheckCircleOutlinedIcon sx={{ color: '#fff', fontSize: 24 }} />
                    }
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: selectedCase.label === "Pneumonia" ? '#9f1239' : '#166534', lineHeight: 1.2 }}>
                      {selectedCase.label === "Pneumonia" ? "VIÊM PHỔI" : "BÌNH THƯỜNG"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: selectedCase.label === "Pneumonia" ? '#e11d48' : '#15803d' }}>
                      Độ tin cậy: {(selectedCase.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', mb: 0.75, display: 'block' }}>
                    Model sử dụng
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    {getModelName(selectedCase)}
                  </Typography>
                </Paper>

                <Divider sx={{ mb: 3 }} />

                {/* Các trường nhập liệu */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontWeight: 600 }}>Kết luận từ Chuyên gia</InputLabel>
                    <Select
                      value={finalLabel}
                      onChange={(e) => setFinalLabel(e.target.value)}
                      label="Kết luận từ Chuyên gia"
                      sx={{ borderRadius: '14px', fontWeight: 700 }}
                    >
                      <MenuItem value="Pneumonia">Viêm phổi (Pneumonia)</MenuItem>
                      <MenuItem value="Normal">Bình thường (Normal)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Nhận xét lâm sàng"
                    placeholder="Nhập ghi chú hoặc biên bản hội chẩn tại đây..."
                    multiline
                    rows={6}
                    fullWidth
                    value={doctorComment}
                    onChange={(e) => setDoctorComment(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                  />
                </Box>

                {/* Cụm Nút bấm */}
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmitReview}
                    disabled={loading || !finalLabel}
                    sx={{
                      py: 1.8,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 800,
                      boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "XÁC NHẬN & LƯU HỒ SƠ"}
                  </Button>
                  <Button
                    variant="text"
                    color="inherit"
                    fullWidth
                    onClick={handleCloseReview}
                    sx={{ py: 1, borderRadius: '10px', fontWeight: 700, textTransform: 'none', color: '#64748b' }}
                  >
                    Bỏ qua ca này
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}

export default DoctorReview;