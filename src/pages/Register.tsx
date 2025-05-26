import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box } from '@mui/material';
import { registerUser } from '../services/auth';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pw: string) => {
    if (pw.length < 8) {
      return 'A jelszónak legalább 8 karakter hosszúnak kell lennie.';
    }
    if (!/[A-Z]/.test(pw)) {
      return 'A jelszónak tartalmaznia kell legalább egy nagybetűt.';
    }
    if (!/[0-9]/.test(pw)) {
      return 'A jelszónak tartalmaznia kell legalább egy számjegyet.';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const validationMsg = validatePassword(newPassword);
    setPasswordError(validationMsg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMsg = validatePassword(password);
    if (validationMsg) {
      setPasswordError(validationMsg);
      return;
    }

    try {
      await registerUser(username, email, password);
      navigate('/login');
    } catch (err) {
      setError('Sikertelen regisztráció. Kérjük, próbálja újra. Már van ilyen felhasználónév vagy email cím.');
      console.error('Sikertelen regisztráció.', err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Regisztráció
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Felhasználónév"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email cím"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Jelszó"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            error={!!passwordError}
            helperText={passwordError}
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Regisztráció
          </Button>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            {"Van már fiókod? Jelentkezz be!"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;