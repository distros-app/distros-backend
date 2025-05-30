import express from 'express';
import { getMyNotes, createNewNote, deleteNote, updateNote, reportBug, featureSuggestion } from './ActionsController.js';

const ActionsRoute = express.Router();

ActionsRoute.get('/', getMyNotes);
ActionsRoute.post('/create-note', createNewNote);
ActionsRoute.post('/delete-note', deleteNote);
ActionsRoute.post('/feature-suggestion', featureSuggestion);
ActionsRoute.post('/report-bug', reportBug);
ActionsRoute.patch('/update-note', updateNote);

export default ActionsRoute;  