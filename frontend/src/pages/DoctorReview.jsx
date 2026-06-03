import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Box, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Divider, Chip, Paper, IconButton, alpha,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import {
  WarningAmber as WarningAmberIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  Close as CloseIcon,
  RateReview as RateReviewIcon,
  LocalHospital as HospitalIcon,
  AutoAwesome as AiIcon,
  Search as SearchIcon,
  VerifiedUser as VerifiedIcon,
  HourglassEmptyOutlined as PendingIcon,
  ImageOutlined as ImageIcon
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
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    const modelName = getModelName(item).toLowerCase();
    const matchesModel = filterModel === 'all' || modelName.includes(filterModel.toLowerCase());
    const matchesDate = !filterDate || (item.createdAt && item.createdAt.startsWith(filterDate));
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'reviewed' ? item.reviewed : !item.reviewed);
    return matchesSearch && matchesLabel && matchesModel && matchesDate && matchesStatus;
  });

  const paginatedCases = filteredCases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => { setPage(0); }, [searchTerm, filterLabel, filterStatus, filterModel, filterDate]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: { xs: 2, md: 8 } }}>
      <Box sx={{ position: 'relative', mb: 6 }}>
        <Paper elevation={0} sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: { xs: '20px', md: '30px' },
          background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
          border: '1px solid #dbeafe',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <AiIcon sx={{ position: 'absolute', right: -20, top: -20, fontSize: 200, color: '#2563eb', opacity: 0.03 }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ bgcolor: '#2563eb', p: 1, borderRadius: '12px', display: 'flex' }}>
                <HospitalIcon sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-1.5px' }}>
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
            <Chip label="Kết quả tìm thấy" sx={{ fontWeight: 800, bgcolor: '#dbeafe', color: '#1e40af', borderRadius: '8px' }} />
          </Box>
        </Paper>
      </Box>

      <ToastNotification open={Boolean(message)} message={message} severity={messageType} onClose={() => setMessage("")} />

      <Paper elevation={0} sx={{
        p: 2,
        mb: 4,
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        background: '#fff'
      }}>
        <TextField fullWidth placeholder="Tìm kiếm mã ID hoặc kết quả AI..." variant="outlined" size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#64748b' }} /></InputAdornment>) }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
          <InputLabel>Kết quả AI</InputLabel>
          <Select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}>
            <MenuItem value="all">Tất cả kết quả</MenuItem>
            <MenuItem value="Normal">Bình thường</MenuItem>
            <MenuItem value="Pneumonia">Viêm phổi</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
          <InputLabel>Mô hình</InputLabel>
          <Select value={filterModel} onChange={e => setFilterModel(e.target.value)} sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}>
            <MenuItem value="all">Tất cả Mô hình</MenuItem>
            <MenuItem value="DenseNet">DenseNet169</MenuItem>
            <MenuItem value="Fusion">Gated Fusion</MenuItem>
            <MenuItem value="ViT">Vision Transformer (ViT)</MenuItem>
          </Select>
        </FormControl>
        <TextField type="date" size="small" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 160 }, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
          InputLabelProps={{ shrink: true }}
        />
      </Paper>

      {filteredCases.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '30px', bgcolor: 'rgba(255,255,255,0.5)', border: '2px dashed #e2e8f0' }}>
          <AiIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 700 }}>Không tìm thấy ca bệnh nào</Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>Hiện tại không có ca bệnh nào cần review hoặc không khớp với tìm kiếm của bạn.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Thời gian</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Hình ảnh</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Kết quả AI</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Mô hình</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', pr: 4 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCases.map(item => (
                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ width: 60, height: 60, borderRadius: '12px', overflow: 'hidden', mx: 'auto', border: '2px solid #f1f5f9' }}>
                      <img src={getImagePath(item.imagePath)} alt="X-ray" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.label === 'Pneumonia' ? 'Viêm phổi' : 'Bình thường'}
                      color={item.label === 'Pneumonia' ? 'error' : 'success'} size="small"
                      sx={{ fontWeight: 800, backdropFilter: 'blur(4px)' }} />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#94a3b8', fontWeight: 600 }}>{(item.confidence * 100).toFixed(1)}%</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={getModelName(item)} variant="outlined" size="small"
                      sx={{ fontWeight: 700, borderStyle: 'dashed' }} />
                  </TableCell>
                  <TableCell align="center">
                    {item.reviewed ? (
                      <Chip icon={<VerifiedIcon style={{ color: '#059669', fontSize: '1rem' }} />} label="Bác sĩ đã duyệt"
                        sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.7rem' }} />
                    ) : (
                      <Chip icon={<PendingIcon style={{ fontSize: '1rem' }} />} label="Đang chờ duyệt"
                        variant="outlined" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', borderStyle: 'dashed' }} />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <IconButton onClick={() => handleOpenReview(item)} sx={{ color: '#2563eb', bgcolor: alpha('#2563eb', 0.05) }}>
                      <RateReviewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredCases.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Số dòng"
          />
        </TableContainer>
      )}

      <Dialog open={!!selectedCase} onClose={handleCloseReview} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', pb: 1 }}>
            Xác nhận kết quả
        </DialogTitle>
        <DialogContent>
            {selectedCase && (
                <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ImageIcon fontSize="small" /> Hình ảnh X-quang
                            </Typography>
                            <DiagnosisMediaViewer
                                originalSrc={getImagePath(selectedCase.imagePath)}
                                gradcamSrc={selectedCase.gradcamPath ? apiUrl(selectedCase.gradcamPath) : null}
                                height={400}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Kết quả AI</Typography>
                                <Typography variant="h5" sx={{
                                    fontWeight: 900,
                                    color: selectedCase.label === 'Pneumonia' ? '#ef4444' : '#10b981'
                                }}>
                                    {selectedCase.label === 'Pneumonia' ? 'VIÊM PHỔI' : 'BÌNH THƯỜNG'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Độ tin cậy: <strong>{(selectedCase.confidence * 100).toFixed(2)}%</strong>
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Mô hình sử dụng</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    {getModelName(selectedCase)}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#2563eb', 0.05), border: '1px solid', borderColor: '#bfdbfe' }}>
                                <Typography variant="overline" sx={{ color: '#1d4ed8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                    <RateReviewIcon sx={{ fontSize: 16 }} />
                                    Kết luận từ Chuyên gia
                                </Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <Select value={finalLabel} onChange={e => setFinalLabel(e.target.value)} sx={{ borderRadius: '10px', bgcolor: '#fff', fontWeight: 700 }}>
                                        <MenuItem value="Pneumonia">Viêm phổi (Pneumonia)</MenuItem>
                                        <MenuItem value="Normal">Bình thường (Normal)</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField placeholder="Nhập ghi chú hoặc biên bản hội chẩn tại đây..." multiline rows={3} fullWidth value={doctorComment} onChange={e => setDoctorComment(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmitReview} disabled={loading || !finalLabel} sx={{ flex: 1, py: 1.5, borderRadius: '14px', textTransform: 'none', fontSize: '1rem', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(37,99,235,0.4)', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' } }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "XÁC NHẬN & LƯU HỒ SƠ"}
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleCloseReview} sx={{ flex: 1, py: 1.5, borderRadius: '14px', fontWeight: 700, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}>
                Bỏ qua ca này
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DoctorReview;