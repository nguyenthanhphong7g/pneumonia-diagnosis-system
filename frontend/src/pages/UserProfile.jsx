import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Card, CardContent, Typography, TextField, Button,
    CircularProgress, Grid, Avatar, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, Paper, Stack, MenuItem, Chip
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Lock as LockIcon,
    Badge as BadgeIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    Email as EmailIcon,
    Security as SecurityIcon,
    Wc as GenderIcon,
    Cake as DOBIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import ToastNotification from '../components/ToastNotification';

function UserProfile() {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        gender: '',
        dateOfBirth: ''
    });

    const API_BASE = `${API_BASE_URL}/api`;

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'error', text: 'Vui lòng đăng nhập lại để tiếp tục.' });
                setLoading(false);
                return;
            }

            const res = await axios.get(`${API_BASE}/admin/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setFormData({
                fullName: res.data.fullName || '',
                phone: res.data.phone || '',
                address: res.data.address || '',
                gender: res.data.gender || '',
                dateOfBirth: res.data.dateOfBirth || ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Không thể tải thông tin hồ sơ' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`${API_BASE}/admin/users/me`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: '✅ Cập nhật thông tin thành công!' });
            setEditing(false);
            loadProfile();
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật' });
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress thickness={5} size={50} />
        </Box>
    );

    return (
        <Box sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, py: 5 }}>
            {/* Tiêu đề trang */}
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 850, color: '#0f172a', letterSpacing: '-0.75px' }}>
                    Thiết lập tài khoản
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mt: 1, fontSize: '0.95rem' }}>
                    Quản lý thông tin cá nhân và cấu hình bảo mật tài khoản cá nhân của bạn
                </Typography>
            </Box>

            <ToastNotification
                open={Boolean(message)}
                message={message?.text || ''}
                severity={message?.type || 'info'}
                onClose={() => setMessage(null)}
            />

            {profile && (
                <Grid container spacing={4} alignItems="flex-start">
                    {/* Cột trái: Avatar & Trạng thái */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03), 0 8px 10px -6px rgba(0,0,0,0.03)',
                            border: '1px solid #f1f5f9',
                            p: 2.25,
                            height: 'auto',
                            alignSelf: 'flex-start',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            background: 'linear-gradient(to bottom, #ffffff, #f8fafc)'
                        }}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row', md: 'column', lg: 'row' },
                                alignItems: 'center',
                                gap: 2,
                                mb: 2
                            }}>
                                <Avatar
                                    sx={{
                                        width: { xs: 72, lg: 76 },
                                        height: { xs: 72, lg: 76 },
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        bgcolor: '#2563eb',
                                        boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
                                    }}
                                >
                                    {profile.username?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ textAlign: { xs: 'center', sm: 'left', md: 'center', lg: 'left' } }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                                        {profile.username}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, wordBreak: 'break-all' }}>
                                        {profile.email}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 2, borderStyle: 'dashed', borderColor: '#cbd5e1' }} />

                            <Stack direction="row" spacing={2}>
                                <Paper variant="none" sx={{ py: 1.8, px: 2, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', flex: 1, textAlign: 'center' }}>
                                    <Typography variant="caption" display="block" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, fontSize: '0.65rem', mb: 0.5, letterSpacing: '0.5px' }}>
                                        Vai trò
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                                        {getRoleLabel(profile.role)}
                                    </Typography>
                                </Paper>

                                <Paper variant="none" sx={{ py: 1.8, px: 2, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', flex: 1, textAlign: 'center' }}>
                                    <Typography variant="caption" display="block" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, fontSize: '0.65rem', mb: 0.5, letterSpacing: '0.5px' }}>
                                        Trạng thái
                                    </Typography>
                                    <Box sx={{
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        color: profile.status === 'LOCKED' ? '#dc2626' : '#16a34a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.8
                                    }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: profile.status === 'LOCKED' ? '#dc2626' : '#16a34a' }} />
                                        {profile.status === 'LOCKED' ? 'Khóa' : 'Online'}
                                    </Box>
                                </Paper>
                            </Stack>
                        </Card>
                    </Grid>

                    {/* Cột phải: Form thông tin chi tiết */}
                    <Grid item xs={12} md={9}>
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03), 0 8px 10px -6px rgba(0,0,0,0.03)',
                            border: '1px solid #f1f5f9',
                            ml: { md: 1 }
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                        <BadgeIcon sx={{ color: '#2563eb' }} /> Thông tin chi tiết
                                    </Typography>
                                </Box>

                                {/* Layout các trường nhập liệu */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                                    <Grid container columnSpacing={4} rowSpacing={3.5}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Họ và tên</Typography>
                                            {editing ? (
                                                <TextField fullWidth size="small" name="fullName" value={formData.fullName} onChange={handleInputChange} inputProps={{ lang: 'vi', inputMode: 'text', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, autoComplete: 'off' }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9', width: '100%' }}>
                                                    <BadgeIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                    <Typography sx={{ color: '#1e293b', fontWeight: 500, ml: 'auto', textAlign: 'right' }}>{profile.fullName || 'Chưa cập nhật'}</Typography>
                                                </Box>
                                            )}
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Giới tính</Typography>
                                            {editing ? (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    name="gender"
                                                    select
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                                >
                                                    <MenuItem value="">-- Chọn --</MenuItem>
                                                    <MenuItem value="male">Nam</MenuItem>
                                                    <MenuItem value="female">Nữ</MenuItem>
                                                    <MenuItem value="other">Khác</MenuItem>
                                                </TextField>
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.2, px: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9', width: '100%' }}>
                                                    <GenderIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                    <Box sx={{ ml: 'auto' }}>
                                                        {formData.gender === 'male' && <Chip label="Nam" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, borderRadius: 1.5 }} />}
                                                        {formData.gender === 'female' && <Chip label="Nữ" size="small" sx={{ bgcolor: '#fce7f3', color: '#b71c1c', fontWeight: 700, borderRadius: 1.5 }} />}
                                                        {formData.gender === 'other' && <Chip label="Khác" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: 1.5 }} />}
                                                        {!formData.gender && <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</Typography>}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Grid container columnSpacing={4} rowSpacing={3.5}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Ngày tháng năm sinh</Typography>
                                            {editing ? (
                                                <TextField fullWidth size="small" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9', width: '100%' }}>
                                                    <DOBIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                    <Typography sx={{ color: '#1e293b', fontWeight: 500, ml: 'auto', textAlign: 'right' }}>{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</Typography>
                                                </Box>
                                            )}
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Số điện thoại</Typography>
                                            {editing ? (
                                                <TextField fullWidth size="small" name="phone" value={formData.phone} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9', width: '100%' }}>
                                                    <PhoneIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                    <Typography sx={{ color: '#1e293b', fontWeight: 500, ml: 'auto', textAlign: 'right' }}>{profile.phone || 'Chưa cập nhật'}</Typography>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Grid container columnSpacing={4} rowSpacing={3.5}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Email (Cố định)</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.5, px: 2, bgcolor: '#e2e8f0', borderRadius: 2.5, opacity: 0.8, width: '100%' }}>
                                                <EmailIcon sx={{ color: '#64748b' }} fontSize="small" />
                                                <Typography sx={{ color: '#334155', fontWeight: 500, ml: 'auto', textAlign: 'right' }}>{profile.email}</Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.2, color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>Địa chỉ cư trú</Typography>
                                            {editing ? (
                                                <TextField fullWidth size="small" name="address" value={formData.address} onChange={handleInputChange} multiline rows={1} inputProps={{ lang: 'vi', inputMode: 'text', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, autoComplete: 'off' }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, py: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9', width: '100%' }}>
                                                    <HomeIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                    <Typography sx={{ color: '#1e293b', fontWeight: 500, ml: 'auto', textAlign: 'right' }}>{profile.address || 'Chưa cập nhật'}</Typography>
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Khu vực nút bấm điều hướng */}
                                <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
                                    {!editing ? (
                                        <Button
                                            variant="contained"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditing(true)}
                                            sx={{
                                                borderRadius: 2.5,
                                                px: 4,
                                                py: 1,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                bgcolor: '#2563eb',
                                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                                                '&:hover': { bgcolor: '#1d4ed8' }
                                            }}
                                        >
                                            Chỉnh sửa thông tin
                                        </Button>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                variant="text"
                                                color="inherit"
                                                startIcon={<CancelIcon />}
                                                onClick={() => setEditing(false)}
                                                sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600, color: '#64748b' }}
                                            >
                                                Hủy bỏ
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSaveProfile}
                                                sx={{
                                                    borderRadius: 2.5,
                                                    px: 4,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                                                }}
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                <Divider sx={{ my: 4, borderColor: '#f1f5f9' }} />

                                {/* Khu vực bảo mật */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    gap: 2
                                }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SecurityIcon sx={{ color: '#ef4444' }} /> Bảo mật tài khoản
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Đổi mật khẩu định kỳ giúp tăng cường an toàn dữ liệu cá nhân</Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<LockIcon />}
                                        onClick={() => setPasswordDialog(true)}
                                        sx={{
                                            borderRadius: 2.5,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            px: 2.5,
                                            borderColor: '#fee2e2',
                                            '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }
                                        }}
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Dialog Đổi mật khẩu */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 850, color: '#0f172a', textAlign: 'center', pt: 3, pb: 1, fontSize: '1.25rem' }}>Thay đổi mật khẩu</DialogTitle>
                <DialogContent sx={{ py: 1 }}>
                    <Stack spacing={2.5} sx={{ mt: 1.5 }}>
                        <TextField label="Mật khẩu hiện tại" type="password" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                        <TextField label="Mật khẩu mới" type="password" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                        <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
                    <Button onClick={() => setPasswordDialog(false)} fullWidth color="inherit" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5 }}>Hủy</Button>
                    <Button variant="contained" fullWidth onClick={() => setPasswordDialog(false)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5 }}>Cập nhật</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function getRoleLabel(role) {
    const roles = {
        'ADMIN': 'Quản trị viên hệ thống',
        'DOCTOR': 'Bác sĩ chuyên khoa',
        'PATIENT': 'Bệnh nhân'
    };
    return roles[role] || role;
}

export default UserProfile;