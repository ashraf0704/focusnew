import {Router} from 'express';
import multer from 'multer';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {fileFromRow, folderFromRow} from '../utils/mappers.js';

export const vaultRouter = Router();
const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 20 * 1024 * 1024}});

vaultRouter.get('/folders', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin.from('vault_folders').select('*').eq('user_id', req.user!.id).order('created_at', {ascending: true});
    if (error) throw new HttpError(400, 'Could not load folders', 'VAULT_FOLDERS_LOAD_FAILED');
    res.json(data.map(folderFromRow));
  } catch (error) {
    next(error);
  }
});

vaultRouter.post('/folders', async (req, res, next) => {
  try {
    const {name, color} = req.body || {};
    const {data, error} = await supabaseAdmin
      .from('vault_folders')
      .insert({user_id: req.user!.id, name, color})
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not create folder', 'VAULT_FOLDER_CREATE_FAILED');
    res.status(201).json(folderFromRow(data));
  } catch (error) {
    next(error);
  }
});

vaultRouter.delete('/folders/:id', async (req, res, next) => {
  try {
    const {error} = await supabaseAdmin.from('vault_folders').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new HttpError(400, 'Could not delete folder', 'VAULT_FOLDER_DELETE_FAILED');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

vaultRouter.get('/files', async (req, res, next) => {
  try {
    let query = supabaseAdmin.from('vault_files').select('*').eq('user_id', req.user!.id).order('created_at', {ascending: false});
    if (req.query.folderId) query = query.eq('folder_id', req.query.folderId);
    const {data, error} = await query;
    if (error) throw new HttpError(400, 'Could not load files', 'VAULT_FILES_LOAD_FAILED');
    res.json(data.map(fileFromRow));
  } catch (error) {
    next(error);
  }
});

vaultRouter.post('/files/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'File is required', 'VALIDATION_ERROR');
    const folderId = req.body.folderId || null;
    const filename = req.file.originalname;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const path = `${req.user!.id}/${Date.now()}-${filename.replace(/[^\w.-]/g, '_')}`;
    const textTypes = ['txt', 'md', 'csv', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css'];
    const textContent = textTypes.includes(ext)
      ? req.file.buffer.toString('utf8').slice(0, 2000)
      : (req.body.textContent || '').slice(0, 2000);

    const {error: uploadError} = await supabaseAdmin.storage.from('vault-files').upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });
    if (uploadError) throw new HttpError(400, 'Could not upload file to storage', 'VAULT_STORAGE_FAILED');

    const {data: publicUrl} = supabaseAdmin.storage.from('vault-files').getPublicUrl(path);
    const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image' :
      ['zip', 'rar', 'tar', 'gz'].includes(ext) ? 'zip' :
      ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext) ? 'code' :
      ext === 'pdf' ? 'pdf' : 'doc';

    const {data, error} = await supabaseAdmin
      .from('vault_files')
      .insert({
        user_id: req.user!.id,
        folder_id: folderId,
        name: filename,
        type: fileType,
        size: `${Math.max(1, Math.round(req.file.size / 1024))} KB`,
        storage_path: path,
        url: publicUrl.publicUrl,
        text_content: textContent,
      })
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not save file metadata', 'VAULT_FILE_CREATE_FAILED');
    res.status(201).json(fileFromRow(data));
  } catch (error) {
    next(error);
  }
});

vaultRouter.delete('/files/:id', async (req, res, next) => {
  try {
    const {data: file} = await supabaseAdmin.from('vault_files').select('*').eq('id', req.params.id).eq('user_id', req.user!.id).single();
    if (file?.storage_path) await supabaseAdmin.storage.from('vault-files').remove([file.storage_path]);
    const {error} = await supabaseAdmin.from('vault_files').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new HttpError(400, 'Could not delete file', 'VAULT_FILE_DELETE_FAILED');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
