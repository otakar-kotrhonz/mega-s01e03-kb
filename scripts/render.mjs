// Copy the built kb pages to rendered/: the pages as the desk sees them, kept in git.
import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('rendered', { recursive: true });
cpSync('build/kb', 'rendered/kb', { recursive: true });
cpSync('build/kb.html', 'rendered/kb.html');
