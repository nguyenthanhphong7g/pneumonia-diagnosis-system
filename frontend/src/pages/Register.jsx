import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, Card, CardContent,
  Alert, Box, CircularProgress, Divider
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckIcon from '@mui/icons-material/Check';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', {
        username,
        email,
        password
      });

      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        py: 4,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '500px',
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Card
          sx={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            borderRadius: '1rem',
          }}
        >
          <CardContent sx={{ p: 3, pt: 3 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2.5 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <HowToRegIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}
              >
                Đăng ký tài khoản
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Tạo tài khoản để sử dụng hệ thống chẩn đoán
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                icon={<CheckIcon />}
                sx={{ mb: 2, borderRadius: 1 }}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleRegister}>
              <TextField
                label="Tên đăng nhập"
                fullWidth
                margin="normal"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{ mb: 2 }}
                inputProps={{ autoComplete: 'username' }}
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                inputProps={{ autoComplete: 'email' }}
              />

              <TextField
                label="Mật khẩu"
                type="password"
                fullWidth
                margin="normal"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 1 }}
                inputProps={{ autoComplete: 'new-password' }}
                helperText="Tối thiểu 6 ký tự"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 3,
                  mb: 1.5,
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: '1rem',
                }}
                disabled={loading}
                startIcon={loading ? undefined : <HowToRegIcon />}
              >
                {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                Đã có tài khoản?
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Đăng nhập tại đây
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Register;