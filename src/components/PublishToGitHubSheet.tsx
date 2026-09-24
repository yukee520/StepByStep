import React, { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '@/components/Button';
import { NEON_PALETTE } from '@/theme/colors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { publishPack, type PublishPackInput } from '@/api/github';
import type { SongPackManifest } from '@/types/songPack';

export type PublishToGitHubSheetProps = {
  visible: boolean;
  onClose: () => void;
  manifest: SongPackManifest | null;
  audioBase64: string | null;
  audioExt: string;
  coverBase64: string | null;
  coverExt: string;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
}): React.ReactElement {
  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: NEON_PALETTE.textDim,
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={NEON_PALETTE.muted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        style={{
          borderWidth: 1,
          borderColor: 'rgba(0, 229, 255, 0.25)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 13,
          color: NEON_PALETTE.text,
          backgroundColor: 'rgba(0, 229, 255, 0.05)',
        }}
      />
    </View>
  );
}

export default function PublishToGitHubSheet({
  visible,
  onClose,
  manifest,
  audioBase64,
  audioExt,
  coverBase64,
  coverExt,
}: PublishToGitHubSheetProps): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings);
  const setGithubToken = useSettingsStore((s) => s.setGithubToken);
  const setGithubOwner = useSettingsStore((s) => s.setGithubOwner);
  const setGithubRepo = useSettingsStore((s) => s.setGithubRepo);
  const setGithubBranch = useSettingsStore((s) => s.setGithubBranch);
  const setGithubPacksPath = useSettingsStore((s) => s.setGithubPacksPath);

  const [tokenDraft, setTokenDraft] = useState<string>(settings.githubToken);
  const [ownerDraft, setOwnerDraft] = useState<string>(settings.githubOwner);
  const [repoDraft, setRepoDraft] = useState<string>(settings.githubRepo);
  const [branchDraft, setBranchDraft] = useState<string>(settings.githubBranch);
  const [pathDraft, setPathDraft] = useState<string>(settings.githubPacksPath);
  const [busy, setBusy] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string): void => {
    setLog((prev) => [...prev.slice(-8), line]);
  }, []);

  const handlePublish = useCallback(async (): Promise<void> => {
    if (!manifest) {
      Toast.show({
        type: 'error',
        text1: 'Nothing to publish',
        position: 'bottom',
      });
      return;
    }

    setBusy(true);
    setLog([]);

    const config = {
      token: tokenDraft.trim(),
      owner: ownerDraft.trim(),
      repo: repoDraft.trim(),
      branch: branchDraft.trim() || 'main',
      packsPath: pathDraft.trim().replace(/^\/+|\/+$/g, '') || 'packs',
    };

    // Persist settings so next time we don't need to re-enter
    setGithubToken(config.token);
    setGithubOwner(config.owner);
    setGithubRepo(config.repo);
    setGithubBranch(config.branch);
    setGithubPacksPath(config.packsPath);

    appendLog(`Publishing to ${config.owner}/${config.repo}@${config.branch}...`);

    const payload: PublishPackInput = {
      config,
      manifest,
      audioBase64,
      audioExt,
      coverBase64,
      coverExt,
    };

    const result = await publishPack(payload);
    setBusy(false);

    if (result.ok) {
      appendLog('✓ ' + result.message);
      Toast.show({
        type: 'success',
        text1: 'Published to GitHub',
        text2: result.message,
        position: 'bottom',
        visibilityTime: 4000,
      });
    } else {
      appendLog('✗ ' + result.message);
      Toast.show({
        type: 'error',
        text1: 'Publish failed',
        text2: result.message,
        position: 'bottom',
        visibilityTime: 5000,
      });
    }
  }, [
    appendLog,
    audioBase64,
    audioExt,
    branchDraft,
    coverBase64,
    coverExt,
    manifest,
    ownerDraft,
    pathDraft,
    repoDraft,
    setGithubBranch,
    setGithubOwner,
    setGithubPacksPath,
    setGithubRepo,
    setGithubToken,
    tokenDraft,
  ]);

  const shortToken =
    settings.githubToken.length > 8
      ? `${settings.githubToken.slice(0, 8)}••••••••`
      : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: NEON_PALETTE.background,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 229, 255, 0.15)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: '900',
              color: NEON_PALETTE.text,
              letterSpacing: 2,
            }}
          >
            PUBLISH
          </Text>
          <Button
            label="Close"
            variant="ghost"
            size="sm"
            onPress={onClose}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 13,
              color: NEON_PALETTE.textDim,
              lineHeight: 20,
            }}
          >
            Uploads the pack to your GitHub repo using the Contents API. The
            token is stored locally on your device.
          </Text>

          {shortToken ? (
            <Text
              style={{
                fontSize: 12,
                color: NEON_PALETTE.textDim,
                marginTop: 8,
              }}
            >
              Current token: {shortToken}
            </Text>
          ) : null}

          <Field
            label="Personal Access Token"
            value={tokenDraft}
            onChange={setTokenDraft}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            secure
          />
          <Field
            label="Repo Owner"
            value={ownerDraft}
            onChange={setOwnerDraft}
            placeholder="your-username"
          />
          <Field
            label="Repo Name"
            value={repoDraft}
            onChange={setRepoDraft}
            placeholder="stepbystep-packs"
          />
          <Field
            label="Branch"
            value={branchDraft}
            onChange={setBranchDraft}
            placeholder="main"
          />
          <Field
            label="Packs Folder"
            value={pathDraft}
            onChange={setPathDraft}
            placeholder="packs"
          />

          {manifest ? (
            <View
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(0, 229, 255, 0.2)',
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: NEON_PALETTE.textDim,
                  letterSpacing: 1,
                }}
              >
                READY TO UPLOAD
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: NEON_PALETTE.text,
                  marginTop: 6,
                }}
              >
                {manifest.title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: NEON_PALETTE.textDim,
                  marginTop: 2,
                }}
              >
                {manifest.artist} · {manifest.chart.length} notes
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: NEON_PALETTE.textDim,
                  marginTop: 6,
                }}
              >
                Files: manifest.json
                {audioBase64 ? `, audio.${audioExt}` : ''}
                {coverBase64 ? `, cover.${coverExt}` : ''}
              </Text>
            </View>
          ) : null}

          {log.length > 0 ? (
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              {log.map((line, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: 11,
                    color: line.startsWith('✓')
                      ? NEON_PALETTE.success
                      : line.startsWith('✗')
                        ? NEON_PALETTE.danger
                        : NEON_PALETTE.textDim,
                    fontFamily: 'monospace',
                    marginBottom: 4,
                  }}
                >
                  {line}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            <Button
              label={busy ? 'Publishing…' : 'Publish to GitHub'}
              icon="cloud-upload-outline"
              size="lg"
              fullWidth
              loading={busy}
              disabled={busy || !manifest}
              onPress={handlePublish}
            />
          </View>

          <Text
            style={{
              fontSize: 11,
              color: NEON_PALETTE.textDim,
              marginTop: 16,
              lineHeight: 18,
            }}
          >
            Note: The token is stored unencrypted on this device. Do not share
            your phone with anyone you don&apos;t trust. If the token is ever
            compromised, revoke it at github.com/settings/tokens.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}