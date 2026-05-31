import {useState} from 'react';
import {ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {router} from 'expo-router';
import {Button} from '@/components/ui/Button';
import {FileCard} from '@/components/vault/FileCard';
import {FolderList} from '@/components/vault/FolderList';
import {UploadDropzone} from '@/components/vault/UploadDropzone';
import {Colors} from '@/constants/colors';
import {useCreateVaultFolder, useDeleteVaultFile, useUploadVaultFile, useVault} from '@/hooks/useVault';
import {CollegeFile} from '@/types';

export default function VaultScreen() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const vault = useVault(folderId);
  const upload = useUploadVaultFile();
  const createFolder = useCreateVaultFolder();
  const deleteFile = useDeleteVaultFile();

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({copyToCacheDirectory: true, multiple: false});
    if (result.canceled) return;
    const asset = result.assets[0];
    const form = new FormData();
    form.append('file', {uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream'} as unknown as Blob);
    if (folderId) form.append('folderId', folderId);
    upload.mutate(form);
  }

  function fileActions(file: CollegeFile) {
    const send = () => router.push({pathname: '/ai-doubt-solver', params: {context: file.textContent || '', contextName: file.name}});
    const remove = () => deleteFile.mutate(file.id);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({options: ['Cancel', 'Send to AI Solver', 'Delete'], destructiveButtonIndex: 2, cancelButtonIndex: 0}, index => {
        if (index === 1) send();
        if (index === 2) remove();
      });
    } else {
      Alert.alert(file.name, 'Choose an action', [{text: 'Send to AI', onPress: send}, {text: 'Delete', style: 'destructive', onPress: remove}, {text: 'Cancel'}]);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.row}><Text style={styles.title}>College Vault</Text><Button variant="ghost" onPress={() => createFolder.mutate({name: `Folder ${Date.now()}`, color: 'indigo'})}>New Folder</Button></View>
      <FolderList folders={vault.folders.data || []} selectedId={folderId} onSelect={setFolderId} />
      <UploadDropzone onPick={pickDocument} />
      {(vault.files.data || []).map((file: CollegeFile) => <FileCard key={file.id} file={file} onLongPress={() => fileActions(file)} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 16, paddingBottom: 110},
  title: {fontSize: 28, fontWeight: '900', color: Colors.dark},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
});
