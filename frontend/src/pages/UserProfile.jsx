import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Box, Card, CardContent, Typography, TextField, Button,
    Alert, CircularProgress, Grid, Avatar, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions, Paper, Stack
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
    Security as SecurityIcon
} from '@mui/icons-material';

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
        address: ''
    });

    const API_BASE = 'http://localhost:8080/api';

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = localStorage.getItem('token');
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
                address: res.data.address || ''
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
            const token = localStorage.getItem('token');
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
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
            {/* Tiêu đề trang */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
                    Thiết lập tài khoản
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
                    Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
                </Typography>
            </Box>

            {message && (
                <Alert 
                    severity={message.type} 
                    onClose={() => setMessage(null)} 
                    sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
                >
                    {message.text}
                </Alert>
            )}

            {profile && (
                <Grid container spacing={3}>
                    {/* Cột trái: Avatar & Trạng thái */}
                    {/* Cột trái: Avatar & Trạng thái - Đã chuyển sang layout ngang */}
<Grid item xs={12} md={4}>
    <Card sx={{ 
        borderRadius: 4, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        p: 3,
        height: '100%', // Đảm bảo cao bằng cột bên phải
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    }}>
        {/* Phần trên: Avatar + Tên nằm ngang */}
        <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row', md: 'column', lg: 'row' }, 
            alignItems: 'center', 
            gap: 2, 
            mb: 3 
        }}>
            <Avatar
                sx={{
                    width: { xs: 80, lg: 90 }, 
                    height: { xs: 80, lg: 90 },
                    fontSize: '2rem', 
                    bgcolor: '#3b82f6',
                    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)'
                }}
            >
                {profile.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left', md: 'center', lg: 'left' } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {profile.username}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {profile.email}
                </Typography>
            </Box>
        </Box>
        
        <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

        {/* Phần dưới: Vai trò & Trạng thái nằm ngang song song */}
        <Stack direction="row" spacing={2}>
            <Paper variant="outlined" sx={{ py: 1.5, px: 2, borderRadius: 3, bgcolor: '#f8fafc', flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', mb: 0.5 }}>
                    Vai trò
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                    {getRoleLabel(profile.role)}
                </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ py: 1.5, px: 2, borderRadius: 3, bgcolor: '#f8fafc', flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem', mb: 0.5 }}>
                    Trạng thái
                </Typography>
                <Typography variant="body2" sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.8rem',
                    color: profile.status === 'LOCKED' ? '#ef4444' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                }}>
                    {profile.status === 'LOCKED' ? '● Khóa' : '● Online'}
                </Typography>
            </Paper>
        </Stack>
    </Card>
</Grid>

                    {/* Cột phải: Form thông tin chi tiết */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BadgeIcon color="primary" /> Thông tin chi tiết
                                    </Typography>
                                    {!editing && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<EditIcon />} 
                                            onClick={() => setEditing(true)}
                                            sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Họ và tên</Typography>
                                        {editing ? (
                                            <TextField fullWidth size="small" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <BadgeIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                <Typography>{profile.fullName || "Chưa cập nhật"}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Số điện thoại</Typography>
                                        {editing ? (
                                            <TextField fullWidth size="small" name="phone" value={formData.phone} onChange={handleInputChange} />
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <PhoneIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                <Typography>{profile.phone || "Chưa cập nhật"}</Typography>
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Email (Cố định)</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, opacity: 0.7 }}>
                                            <EmailIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                            <Typography>{profile.email}</Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>Địa chỉ cư trú</Typography>
                                        {editing ? (
                                            <TextField fullWidth size="small" name="address" value={formData.address} onChange={handleInputChange} multiline rows={2} />
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <HomeIcon sx={{ color: '#94a3b8' }} fontSize="small" />
                                                <Typography>{profile.address || "Chưa cập nhật"}</Typography>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>

                                {editing && (
                                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button 
                                            variant="outlined" 
                                            color="inherit" 
                                            startIcon={<CancelIcon />} 
                                            onClick={() => setEditing(false)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Hủy bỏ
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            startIcon={<SaveIcon />} 
                                            onClick={handleSaveProfile}
                                            sx={{ borderRadius: 2, px: 4 }}
                                        >
                                            Lưu thay đổi
                                        </Button>
                                    </Box>
                                )}

                                <Divider sx={{ my: 4 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SecurityIcon color="error" /> Bảo mật tài khoản
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Đổi mật khẩu định kỳ để bảo vệ tài khoản</Typography>
                                    </Box>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        startIcon={<LockIcon />}
                                        onClick={() => setPasswordDialog(true)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Dialog Đổi mật khẩu - Tinh chỉnh giao diện */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3 }}>Thay đổi mật khẩu</DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Mật khẩu hiện tại" type="password" fullWidth size="small" />
                        <TextField label="Mật khẩu mới" type="password" fullWidth size="small" />
                        <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth size="small" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setPasswordDialog(false)} fullWidth color="inherit">Hủy</Button>
                    <Button variant="contained" fullWidth onClick={() => setPasswordDialog(false)}>Cập nhật</Button>
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