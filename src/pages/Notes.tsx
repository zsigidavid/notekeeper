// src/pages/Notes.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Importáljuk a useNavigate-t
// Hozzáadtuk az AppBar, Toolbar importokat
import { TextField, Button, Typography, Container, Box, List, ListItem, ListItemText, IconButton, AppBar, Toolbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { RootState } from '../store/store';
import { fetchNotes, createNote, updateNote, deleteNote } from '../services/notes';
import { logout } from '../store/slices/authSlice'; // Importáljuk a logout action-t
import axios from 'axios'; 

interface Note {
  _id: string;
  title: string;
  content: string;
}

const Notes: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  // State a siker és hiba üzenetekhez
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State a törlés megerősítő dialógushoz
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const dispatch = useDispatch(); // Használjuk a useDispatch hookot
  const navigate = useNavigate(); // Használjuk a useNavigate hookot

  // Üzenetek törlésére szolgáló segédfüggvény
  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  useEffect(() => {
    loadNotes();
  }, [token]);

  const loadNotes = async () => {
    // Töröljük az előző üzeneteket, mielőtt újratöltjük a jegyzeteket (csak ezen a ponton)
    clearMessages();
    try {
      const response = await fetchNotes(token!);
      setNotes(response);
    } catch (err) {
      console.error('Hiba a betöltéskor', err);
      if (axios.isAxiosError(err) && err.response && err.response.status === 401) {
        dispatch(logout());
        navigate('/login');
      } else {
        setErrorMessage('Hiba a betöltéskor.');
      }
    }
    // Timeout a loadNotes hibánál megjelenő üzenetre (ha nincs 401)
    // setTimeout(clearMessages, 3000); // Ezt itt is kikommentelem a teszteléshez
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Töröljük az előző üzeneteket a művelet előtt
    clearMessages();

    // Alap validáció: cím és tartalom nem lehet üres
    if (!title.trim() || !content.trim()) { // Használjuk a trim()-et a whitespace-ek eltávolítására
        setErrorMessage('A cím és a tartalom nem lehet üres.');
        return; // Ne küldjük el a formot, ha van validációs hiba
    }

    try {
      if (editingNote) {
        await updateNote(editingNote._id, { title, content }, token!);
        // Sikeres frissítés után töltsük újra a jegyzeteket
        await loadNotes(); // Várjuk meg, amíg lefut a jegyzetek újratöltése
        setSuccessMessage('Sikeres frissítés!'); // *** ÁTHELYEZVE ÉS BEÁLLÍTVA loadNotes() után ***
      } else {
        await createNote({ title, content }, token!);
        // Sikeres létrehozás után töltsük újra a jegyzeteket
        await loadNotes(); // Várjuk meg, amíg lefut a jegyzetek újratöltése
        setSuccessMessage('Jegyzet sikeresen létrehozva!'); // *** ÁTHELYEZVE ÉS BEÁLLÍTVA loadNotes() után ***
      }
      // Üres mezők és szerkesztési mód sikeres mentés és újratöltés után
      setTitle('');
      setContent('');
      setEditingNote(null);

    } catch (err) {
      console.error('Nem sikerült menteni a jegyzetet:', err);
      // Próbáljuk meg kiolvasni a hibaüzenetet a backend válaszából, ha elérhető
      const backendErrorMessage = axios.isAxiosError(err) && err.response?.data?.error;
      setErrorMessage(`Nem sikerült menteni a jegyzetet: ${backendErrorMessage || 'váratlan hiba történt.'}`);
    }
    // Üzenetek törlése 3 másodperc múlva (siker vagy hiba esetén)
     setTimeout(clearMessages, 3000); // Ezt a timeoutot megtartjuk a siker/hiba üzenetekhez
  };

  const handleEdit = (note: Note) => {
    // Szerkesztéskor töröljük az üzeneteket
    clearMessages();
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  // Ezt a függvényt módosítjuk, hogy megnyissa a dialógust
  const handleDelete = (id: string) => {
     clearMessages();
     setDeleteDialogOpen(true); // Megnyitjuk a dialógust
     setNoteToDeleteId(id); // Eltároljuk a törlendő jegyzet ID-jét
  };

  // Új függvény a törlés végrehajtására a megerősítés után
  const handleDeleteConfirm = async () => {
      if (!noteToDeleteId) return; // Ha nincs ID tárolva, ne csináljunk semmit

      // Bezárjuk a dialógust a törlés előtt
      handleDeleteClose();

      try {
        await deleteNote(noteToDeleteId, token!);
        await loadNotes();
        setSuccessMessage('Jegyzet sikeresen törölve!');
      } catch (err) {
        console.error('Nem sikerült törölni a jegyzetet.', err);
         const backendErrorMessage = axios.isAxiosError(err) && err.response?.data?.error;
         setErrorMessage(`Nem sikerült törölni a jegyzetet: ${backendErrorMessage || 'Váratlan hiba történt.'}`);
      }
       setTimeout(clearMessages, 3000);
  };

  // Dialógus bezárása
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setNoteToDeleteId(null); // Fontos, hogy töröljük a tárolt ID-t is
  };

  // Kilépés kezelő függvény
  const handleLogout = () => {
    dispatch(logout()); // Küldjük a logout action-t a Redux store-nak
    navigate('/login'); // Navigáljunk a bejelentkező oldalra
  };

  return (
    <Box sx={{ flexGrow: 1 }}> {/* AppBar konténer */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Jegyzeteim
          </Typography>
          <Button color="inherit" onClick={handleLogout}> {/* Kilépés gomb */}
            Kijelentkezés
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ mt: 4 }}> {/* Tartalom konténer */}
        {/* Siker üzenet megjelenítése Alert komponensben */}
        {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
            </Alert>
        )}
         {/* Hiba üzenet megjelenítése Alert komponensben */}
        {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
            </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Cím"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required // Kötelező mező a HTML5 validációhoz
            error={!!errorMessage && !title.trim()} // Hiba jelzése, ha van általános hibaüzenet ÉS üres a cím (vagy a backend küldött címmel kapcsolatos hibát)
            helperText={!!errorMessage && !title.trim() ? 'Cím szükséges' : ''} // Hibaüzenet a címhez (vagy backend hiba)
          />
          <TextField
            fullWidth
            label="Tartalom"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            required // Kötelező mező a HTML5 validációhoz
            error={!!errorMessage && !content.trim()} // Hiba jelzése, ha van általános hibaüzenet ÉS üres a tartalom (vagy backend küldött tartalommal kapcsolatos hibát)
            helperText={!!errorMessage && !content.trim() ? 'Tartalom szükséges.' : ''} // Hibaüzenet a tartalomhoz (vagy backend hiba)
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            {editingNote ? 'Jegyzet frissítés' : 'Jegyzet létrehozása'}
          </Button>
          {editingNote && ( // Szerkesztés módban megjelenő "Cancel" gomb
            <Button variant="outlined" sx={{ mt: 2, ml: 2 }} onClick={() => { setEditingNote(null); setTitle(''); setContent(''); clearMessages(); }}>
              Mégsem
            </Button>
          )}
        </Box>
        <List>
          {notes.map((note) => (
            <ListItem
              key={note._id}
              secondaryAction={
                <Box>
                  {/* Hozzáadott aria-label a jobb akadálymentesítéshez */}
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(note)}>
                    <EditIcon />
                  </IconButton>
                  {/* A handleDelete már nem töröl azonnal, hanem megnyitja a dialógust */}
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(note._id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={note.title}
                secondary={note.content}
              />
            </ListItem>
          ))}
        </List>
        {/* Üres jegyzetlista esetén üzenet */}
        {notes.length === 0 && !errorMessage && (
             <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}>
                 Nincs még jegyzeted. Hozz létre egyet a fenti űrlap segítségével.
             </Typography>
        )}
      </Container>

      {/* Törlés megerősítő dialógus */}
      <Dialog
        open={deleteDialogOpen} // A state vezérli a láthatóságot
        onClose={handleDeleteClose} // Bezáródik a háttérre vagy Esc-re
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Jegyzet törlése"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Biztos törölni szeretnéd? A folyamat nem visszafordítható.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Mégsem</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus> {/* Az autoFocus alapból kijelöli */}
            Törlés
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notes;