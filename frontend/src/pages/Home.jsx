import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AI_SERVICE_URL, apiUrl } from '../config/api';
import { exportHomeDiagnosisPdf } from '../utils/diagnosisReportPdf';
import { AuthContext } from '../context/AuthContext';
import {
  Box, Button, Typography, Paper, LinearProgress, Alert,
  Container, Card, CardContent, Stack, IconButton, Divider,
  CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Grid
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Giữ lại nếu bạn có dùng
import ErrorIcon from '@mui/icons-material/Error'; // Giữ lại nếu bạn có dùng
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import DownloadIcon from '@mui/icons-material/Download';

export default function Home() {
  const { token } = useContext(AuthContext);
  const apiBaseUrl = AI_SERVICE_URL;
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [gradcamImg, setGradcamImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [compareMetrics, setCompareMetrics] = useState(null);
  const [loadingCompareMetrics, setLoadingCompareMetrics] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/models`);
        const availableModels = Array.isArray(res.data?.models) ? res.data.models : [];
        setModels(availableModels);
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0].model_id || '');
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Không thể tải danh sách model.');
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [apiBaseUrl]);

  // Fetch metrics when selectedModel changes
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedModel || selectedModel === 'compare') {
        if (selectedModel === 'compare') {
          // Fetch all 3 model metrics for comparison
          await fetchCompareMetrics();
        } else {
          setMetrics(null);
        }
        return;
      }

      setLoadingMetrics(true);
      try {
        let backendModelName = 'densenet169'; // default fallback
        const modelId = (selectedModel || '').toLowerCase();

        if (modelId.includes('gated') || modelId.includes('fusion') || modelId.includes('rf') || modelId.includes('random')) {
          backendModelName = 'gated_fusion';
        } else if (modelId.includes('vit') || modelId.includes('logistic')) {
          backendModelName = 'vit';
        }

        try {
          const backendUrl = apiUrl(`/api/metrics/${encodeURIComponent(backendModelName)}`);
          const metricsRes = await axios.get(backendUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (metricsRes.data) {
            setMetrics(metricsRes.data);
          } else {
            setMetrics(null);
          }
        } catch (backendErr) {
          try {
            const aiUrl = `${apiBaseUrl}/api/metrics/${encodeURIComponent(backendModelName)}`;
            const metricsRes = await axios.get(aiUrl);
            if (metricsRes.data) {
              setMetrics(metricsRes.data);
            } else {
              setMetrics(null);
            }
          } catch (aiErr) {
            console.log('Metrics not available for', backendModelName);
            setMetrics(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setMetrics(null);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [selectedModel, token, apiBaseUrl]);

  const fetchCompareMetrics = async () => {
    setLoadingCompareMetrics(true);
    const modelNames = ['gated_fusion', 'vit', 'densenet169'];
    const fetchedMetrics = {};

    for (const modelName of modelNames) {
      try {
        const backendUrl = apiUrl(`/api/metrics/${encodeURIComponent(modelName)}`);
        const metricsRes = await axios.get(backendUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (metricsRes.data) {
          fetchedMetrics[modelName] = metricsRes.data;
        }
      } catch (backendErr) {
        try {
          const aiUrl = `${apiBaseUrl}/api/metrics/${encodeURIComponent(modelName)}`;
          const metricsRes = await axios.get(aiUrl);
          if (metricsRes.data) {
            fetchedMetrics[modelName] = metricsRes.data;
          }
        } catch (aiErr) {
          console.log('Metrics not available for', modelName);
        }
      }
    }
    setCompareMetrics(fetchedMetrics);
    setLoadingCompareMetrics(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setGradcamImg(null);
    setError(null);
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setGradcamImg(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setCompareResults(null); // Clear compare results when doing single predict
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedModel) {
        formData.append("model", selectedModel);
      }

      const useBackend = Boolean(token);
      const predictUrl = useBackend ? apiUrl('/api/diagnosis/predict') : `${apiBaseUrl}/predict`;
      const predictHeaders = {
        'Content-Type': 'multipart/form-data'
      };
      if (useBackend) {
        predictHeaders.Authorization = `Bearer ${token}`;
      }

      const res = await axios.post(predictUrl, formData, { headers: predictHeaders });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResult({
          label: res.data.label,
          confidence: res.data.confidence,
          model: res.data.model,
          runtime_ms: res.data.runtime_ms || 0,
          timestamp: new Date().toLocaleTimeString("vi-VN")
        });
        // If backend returned a gradcam (path or base64), use it. Otherwise fallback to separate gradcam endpoint.
        if (res.data.gradcamPath) {
          setGradcamImg(apiUrl(res.data.gradcamPath));
        } else if (res.data.gradcam_base64) {
          setGradcamImg(`data:image/png;base64,${res.data.gradcam_base64}`);
        } else {
          try {
            const gradcamUrl = useBackend ? apiUrl('/api/diagnosis/gradcam') : `${apiBaseUrl}/api/gradcam`;
            const gradcamHeaders = useBackend
              ? { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
              : { 'Content-Type': 'multipart/form-data' };
            const gradRes = await axios.post(gradcamUrl, formData, { responseType: "blob", headers: gradcamHeaders });
            setGradcamImg(URL.createObjectURL(gradRes.data));
          } catch (gradErr) {
            console.log("GradCAM not available, continuing without it");
          }
        }
      }

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);

    } catch (err) {
      const errorMsg = err.response?.data?.error || "Không thể kết nối với máy chủ AI/backend. Hãy kiểm tra các service đang chạy.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const exportDiagnosisReport = () => {
    exportHomeDiagnosisPdf({
      result,
      displayConfidence,
      preview,
      gradcamImg,
      patientId: result?.patientId
    });
  };
  const handleCompare = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResult(null); // Clear single predict result when doing compare
    setGradcamImg(null); // Clear gradcam when doing compare
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const modelList = models.map((m) => m.model_id).join(',');
      formData.append('models', modelList);

      const useBackend = Boolean(token);
      const compareUrl = useBackend ? apiUrl('/api/diagnosis/compare') : `${apiBaseUrl}/compare`;
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (useBackend) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(compareUrl, formData, { headers });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setCompareResults(res.data.models || res.data?.models || null);
        // Fetch metrics for compare view
        await fetchCompareMetrics();
      }
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.response?.data?.error || 'So sánh model thất bại');
    } finally {
      setLoading(false);
    }
  };

  const displayConfidence = result && Number.isFinite(result.confidence) ? result.confidence * 100 : 0;

  // Component phụ hiển thị progress bar cho metrics
  const RenderMetricBar = ({ label, value, color }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b' }}>
          {(value * 100).toFixed(2)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: '#e2e8f0',
          '& .MuiLinearProgress-bar': { bgcolor: color }
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 6 }}>
      {/* Container mở rộng tối đa để đẩy metrics sang sát biên phải */}
      <Container maxWidth="xl">
        <Grid container spacing={4}>

          {/* --- CỘT GIỮA: KHU VỰC CHẨN ĐOÁN (Căn giữa trong không gian còn lại) --- */}
          <Grid item xs={12} md={10} lg={10} sx={{ display: 'flex', justifyContent: 'center', ml: 'auto' }}>
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              {/* Box Upload */}
              <Paper elevation={0} sx={{
                p: 4, borderRadius: '28px', border: '1px solid #e2e8f0',
                boxShadow: '0 4px 25px rgba(0,0,0,0.03)', textAlign: 'center', mb: 4, minWidth: 400
              }}>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: '#1e293b' }}>
                  PneuVision <span style={{ color: '#3b82f6' }}>AI</span>
                </Typography>

                <Box
                  component="label"
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: 350, borderRadius: '20px', bgcolor: '#0f172a',
                    cursor: !preview ? 'pointer' : 'default', border: '2px dashed #cbd5e1',
                    overflow: 'hidden', position: 'relative', transition: '0.3s',
                    '&:hover': !preview ? { borderColor: '#3b82f6', bgcolor: '#1e293b' } : {}
                  }}
                >
                  {!preview ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <input hidden type="file" accept="image/*" onChange={handleFileChange} />
                      <CloudUploadIcon sx={{ fontSize: 60, color: '#475569', mb: 1 }} />
                      <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Tải ảnh X-quang lồng ngực</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Hỗ trợ định dạng JPG, PNG</Typography>
                    </Box>
                  ) : (
                    <img src={preview} alt="Input" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, alignItems: 'center' }}>
                  <Button
                    fullWidth variant="contained" size="large"
                    disabled={!selectedFile || loading}
                    onClick={selectedModel === 'compare' ? handleCompare : handlePredict}
                    startIcon={<PsychologyIcon />}
                    sx={{
                      borderRadius: '14px', py: 1.8, fontWeight: 700, bgcolor: '#1e293b',
                      boxShadow: '0 8px 15px rgba(0,0,0,0.1)',
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    {loading ? 'ĐANG PHÂN TÍCH...' : (selectedModel === 'compare' ? 'SO SÁNH CÁC MODEL' : 'CHẨN ĐOÁN NGAY')}
                  </Button>
                  <IconButton onClick={reset} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', width: 60, height: 60 }}>
                    <RestartAltIcon />
                  </IconButton>
                </Stack>

                {loading && <LinearProgress sx={{ mt: 3, borderRadius: 5, height: 6 }} />}
                {error && <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>{error}</Alert>}
              </Paper>

              {/* Box Kết quả AI & Grad-CAM */}
              {(result || loading) && (
                <Paper elevation={0} sx={{
                  p: 4, borderRadius: '28px', border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', mb: 4, minWidth: 400
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: '#64748b', textAlign: 'center' }}>
                    KẾT QUẢ PHÂN TÍCH TỪ HỆ THỐNG
                  </Typography>

                  {result && (
                    <Card elevation={0} sx={{
                      mb: 3, borderRadius: '20px',
                      bgcolor: result.label === "Pneumonia" ? '#fff1f2' : '#f0fdf4',
                      border: '1px solid', borderColor: result.label === "Pneumonia" ? '#fecaca' : '#bbf7d0'
                    }}>
                      <CardContent sx={{ py: '20px !important', px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block' }}>CHẨN ĐOÁN</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: result.label === "Pneumonia" ? '#e11d48' : '#16a34a' }}>
                            {result.label === "Pneumonia" ? "VIÊM PHỔI" : "BÌNH THƯỜNG"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5 }}>
                            Model: {(() => {
                              const m = (result.model || '').toString();
                              if (!m) return 'unknown';
                              if (m === 'gated_fusion') return 'Gated Fusion';
                              if (m === 'random_forest') return 'Random Forest';
                              if (m === 'rf') return 'Random Forest';
                              if (m === 'vit_logistic') return 'ViT + LogisticRegression';
                              if (m === 'densenet') return 'DenseNet (fallback)';
                              return m;
                            })()}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', display: 'block' }}>ĐỘ TIN CẬY</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                            {displayConfidence.toFixed(1)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {selectedModel !== 'compare' && (
                    <>
                      <Box sx={{
                        height: 400, bgcolor: '#000', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative'
                      }}>
                        {loading ? (
                          <Stack spacing={2} sx={{ width: '60%', alignItems: 'center' }}>
                            <CircularProgress size={30} />
                            <Typography sx={{ color: '#fff', fontSize: '0.8rem' }}>Đang tạo bản đồ nhiệt...</Typography>
                          </Stack>
                        ) : (
                          gradcamImg && (
                            <>
                              <img src={gradcamImg} alt="Heatmap" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                                <Chip label="Bản đồ Grad-CAM" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)', fontWeight: 700 }} />
                              </Box>
                            </>
                          )
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block', textAlign: 'center' }}>
                        * Hình ảnh trên hiển thị vùng phổi mà AI nhận diện có dấu hiệu bất thường.
                      </Typography>
                    </>
                  )}

                  {selectedModel === 'compare' && !loading && (
                    <Box sx={{
                      height: 200, bgcolor: '#f0f9ff', borderRadius: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #bfdbfe', position: 'relative', flexDirection: 'column'
                    }}>
                      <QueryStatsIcon sx={{ fontSize: 40, color: '#0369a1', mb: 2 }} />
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Thời gian so sánh dự kiến</Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                        {compareResults && compareResults.map((m, idx) => (
                          <Box key={idx} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.5 }}>
                              {m.model}
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#1e293b' }}>
                              {m.runtime_ms || '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>ms</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Nút xuất báo cáo */}
                  {result && !loading && selectedModel !== 'compare' && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={exportDiagnosisReport}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          '&:hover': { bgcolor: '#eff6ff', borderColor: '#1e40af' }
                        }}
                      >
                        Xuất Báo Cáo
                      </Button>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Box So sánh model */}
              {compareResults && (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '28px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', minWidth: 500 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: '#64748b', textAlign: 'center' }}>
                    SO SÁNH KẾT QUẢ THEO MODEL
                  </Typography>
                  <Stack spacing={2}>
                    {compareResults.map((m, idx) => (
                      <Card key={idx} elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', p: 2, border: '1px solid #f1f5f9', bgcolor: '#f8fafc', borderRadius: '16px' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#1e293b' }}>{m.model}</Typography>
                          <Typography variant="body2" sx={{ color: m.label === "Pneumonia" ? '#e11d48' : m.label === "Normal" ? '#16a34a' : '#475569', fontWeight: 600 }}>
                            {m.label || m.error || '—'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {m.confidence ? ((m.confidence * 100).toFixed(1) + '%') : '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{m.runtime_ms ? m.runtime_ms + ' ms' : ''}</Typography>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* --- CỘT BÊN PHẢI: CẤU HÌNH & BẢNG ĐỘ ĐO --- */}
          <Grid item xs={12} md={2} lg={2} sx={{ ml: 'auto' }}>
            {/* Sử dụng position sticky để block bên phải luôn ở trong tầm nhìn khi scroll xuống */}
            <Box sx={{ position: 'sticky', top: 24 }}>

              {/* Chọn Model */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', mb: 3, minWidth: 370 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <SettingsSuggestIcon sx={{ color: '#3b82f6' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Cấu hình Mô hình
                  </Typography>
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="model-select-label">Chọn Model AI</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={selectedModel}
                    label="Chọn Model AI"
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      // Clear results when switching
                      setResult(null);
                      setGradcamImg(null);
                      setCompareResults(null);
                    }}
                    disabled={loadingModels || models.length === 0}
                    sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                  >
                    {models.map((item) => (
                      <MenuItem key={item.model_id} value={item.model_id}>
                        <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                        <Typography variant="caption" sx={{ ml: 1, color: '#94a3b8' }}>v{item.version}</Typography>
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem value="compare">
                      <Typography sx={{ fontWeight: 600, color: '#0369a1' }}>So sánh tất cả</Typography>
                    </MenuItem>
                  </Select>
                  <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                    {loadingModels
                      ? 'Đang tải danh sách model...'
                      : selectedModel === 'compare'
                        ? 'Hiển thị bảng so sánh 3 model'
                        : selectedModel
                          ? `ID: ${selectedModel}`
                          : 'Chưa có model nào sẵn sàng'}
                  </Typography>
                </FormControl>
              </Paper>

              {/* Bảng độ đo mô hình (Metrics) */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <QueryStatsIcon sx={{ color: '#10b981' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Độ đo Mô hình
                  </Typography>
                </Box>

                {selectedModel === 'compare' ? (
                  loadingCompareMetrics ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
                      <CircularProgress size={20} thickness={5} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Đang tải độ đo...</Typography>
                    </Box>
                  ) : compareMetrics && Object.keys(compareMetrics).length > 0 ? (
                    <Box sx={{ mt: 2, overflowX: 'auto' }}>
                      <Box sx={{ minWidth: 320 }}>
                        {/* Header Row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '80px 70px 70px 70px', gap: 0.25, mb: 1, fontWeight: 700 }}>
                          <Box></Box>
                          <Box sx={{ textAlign: 'center', color: '#0369a1', fontSize: '0.7rem', fontWeight: 700 }}>Gated Fusion</Box>
                          <Box sx={{ textAlign: 'center', color: '#16a34a', fontSize: '0.7rem', fontWeight: 700 }}>Vision Transformer</Box>
                          <Box sx={{ textAlign: 'center', color: '#d97706', fontSize: '0.7rem', fontWeight: 700 }}>DenseNet169</Box>
                        </Box>

                        {/* Metric Rows */}
                        {['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC'].map((metricLabel) => {
                          const metricKey = metricLabel.includes('F1') ? 'f1Score' : metricLabel.includes('AUC') ? 'auc' : metricLabel.toLowerCase();
                          const gatedVal = compareMetrics.gated_fusion ?
                            (compareMetrics.gated_fusion[metricKey] || compareMetrics.gated_fusion[metricKey.replace('f1Score', 'f1_score')] || 0) : 0;
                          const vitVal = compareMetrics.vit ?
                            (compareMetrics.vit[metricKey] || compareMetrics.vit[metricKey.replace('f1Score', 'f1_score')] || 0) : 0;
                          const denseVal = compareMetrics.densenet169 ?
                            (compareMetrics.densenet169[metricKey] || compareMetrics.densenet169[metricKey.replace('f1Score', 'f1_score')] || 0) : 0;

                          return (
                            <Box key={metricLabel} sx={{ display: 'grid', gridTemplateColumns: '80px 70px 70px 70px', gap: 0.25, py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem' }}>{metricLabel}</Typography>
                              <Box sx={{ textAlign: 'center', bgcolor: '#f0f9ff', p: 0.25, borderRadius: '4px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', fontSize: '0.7rem' }}>
                                  {(gatedVal * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center', bgcolor: '#f0fdf4', p: 0.25, borderRadius: '4px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.7rem' }}>
                                  {(vitVal * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center', bgcolor: '#fef3c7', p: 0.25, borderRadius: '4px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706', fontSize: '0.7rem' }}>
                                  {(denseVal * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}

                        {/* Runtime Row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '80px 70px 70px 70px', gap: 0.25, py: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem' }}>Inference (ms)</Typography>
                          <Box sx={{ textAlign: 'center', bgcolor: '#f0f9ff', p: 0.25, borderRadius: '4px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', fontSize: '0.7rem' }}>
                              {compareMetrics.gated_fusion?.expectedRuntimeMs || '—'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', bgcolor: '#f0fdf4', p: 0.25, borderRadius: '4px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.7rem' }}>
                              {compareMetrics.vit?.expectedRuntimeMs || '—'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', bgcolor: '#fef3c7', p: 0.25, borderRadius: '4px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706', fontSize: '0.7rem' }}>
                              {compareMetrics.densenet169?.expectedRuntimeMs || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        Chưa có dữ liệu độ đo.
                      </Typography>
                    </Box>
                  )
                ) : loadingMetrics ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
                    <CircularProgress size={20} thickness={5} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Đang phân tích dữ liệu...</Typography>
                  </Box>
                ) : metrics ? (
                  <Box sx={{ mt: 2 }}>
                    <RenderMetricBar label="Accuracy" value={metrics.accuracy} color="#3b82f6" />
                    <RenderMetricBar label="Precision" value={metrics.precision} color="#10b981" />
                    <RenderMetricBar label="Recall" value={metrics.recall} color="#f59e0b" />
                    <RenderMetricBar label="F1-Score" value={metrics.f1Score} color="#8b5cf6" />
                    <RenderMetricBar label="AUC (Area Under Curve)" value={metrics.auc} color="#ec4899" />

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f0f9ff', p: 1.5, borderRadius: '10px' }}>
                      <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700 }}>⏱️ Thời gian dự kiến (Inference):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#0284c7' }}>
                        {metrics.expectedRuntimeMs} ms
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                      Chưa có dữ liệu độ đo.<br />Vui lòng chọn model khác.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}