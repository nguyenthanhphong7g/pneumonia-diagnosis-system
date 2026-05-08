import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton,
  useMediaQuery, useTheme, Menu, MenuItem, Divider, Tooltip, Fade
} from '@mui/material';
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Logout as LogoutIcon,
  Login as LoginIcon,
  HowToReg as HowToRegIcon,
  Menu as MenuIcon,
  AccountCircleOutlined as PersonIcon,
  SettingsOutlined as SettingsIcon,
  NotificationsNoneOutlined as NotificationIcon
} from '@mui/icons-material';

function Header({ onToggleSidebar }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileNavigate = () => {
    handleMenuClose();
    navigate('/profile');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)', // Hiệu ứng kính siêu mờ
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        height: '70px', // Cao hơn một chút cho thoáng
        zIndex: 1201,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 6 }, height: '100%' }}>

        {/* LEFT: LOGO HI-TECH */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && isMobile && (
            <IconButton onClick={onToggleSidebar} sx={{ mr: 1, bgcolor: '#f8fafc' }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
              transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' }
            }}
          >
            <Box sx={{
              width: 45, height: 45, borderRadius: '14px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
              position: 'relative',
              '&::after': { // Tạo hiệu ứng vòng sáng bao quanh logo
                content: '""', position: 'absolute', inset: -3,
                borderRadius: '16px', border: '2px solid #3b82f6', opacity: 0.2
              }
            }}>
              <Typography sx={{ fontSize: '1.6rem' }}>🫁</Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 900, fontSize: '1.2rem', color: '#0f172a',
                letterSpacing: '-0.8px', lineHeight: 1
              }}>
                Pneumonia<Box component="span" sx={{ color: '#2563eb' }}>.AI</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Advanced Diagnostics
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* RIGHT: PROFILE & ACTIONS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
          {user ? (
            <>
              {/* Notification Icon - Cho giống Dashboard xịn */}
              <IconButton sx={{ color: '#64748b', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <NotificationIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1, height: 24 }} />

              <Box
                onClick={handleMenuOpen}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    handleMenuOpen(event);
                  }
                }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                  p: '6px 12px', borderRadius: '16px', bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0', transition: '0.3s',
                  '&:hover': { bgcolor: '#fff', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)', borderColor: '#3b82f6' }
                }}
              >
                <Avatar sx={{
                  width: 38, height: 38, fontWeight: 800, fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}>
                  {user.username?.[0].toUpperCase()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                    Dr. {user.username}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>
                    {user.role?.toUpperCase() || 'SPECIALIST'}
                  </Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                TransitionComponent={Fade}
                PaperProps={{
                  sx: {
                    mt: 2, borderRadius: '20px', minWidth: 240, p: 1,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f5f9'
                  }
                }}
              >
                <MenuItem onClick={handleProfileNavigate} sx={{ borderRadius: '12px', py: 1.5, gap: 2 }}>
                  <PersonIcon sx={{ color: '#64748b' }} />
                  <Typography sx={{ fontWeight: 600 }}>Thông tin cá nhân</Typography>
                </MenuItem>
                <MenuItem onClick={handleMenuClose} sx={{ borderRadius: '12px', py: 1.5, gap: 2 }}>
                  <SettingsIcon sx={{ color: '#64748b' }} />
                  <Typography sx={{ fontWeight: 600 }}>Cấu hình hệ thống</Typography>
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { handleMenuClose(); logout(); navigate('/login'); }}
                  sx={{ borderRadius: '12px', py: 1.5, gap: 2, color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                  <LogoutIcon />
                  <Typography sx={{ fontWeight: 700 }}>Đăng xuất</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => navigate('/login')} sx={{ fontWeight: 700, color: '#475569', textTransform: 'none' }}>
                Đăng nhập
              </Button>
              <Button
                variant="contained" disableElevation onClick={() => navigate('/register')}
                sx={{
                  borderRadius: '12px', px: 4, py: 1, fontWeight: 800, textTransform: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 15px 20px -5px rgba(37, 99, 235, 0.4)' }
                }}
              >
                Bắt đầu
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;