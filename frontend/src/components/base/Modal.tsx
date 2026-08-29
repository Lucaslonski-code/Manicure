import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { colors, spacing, typography, radius, elevation, iconSizes, touchTarget } from '@theme';
import AppIcon from '@components/icons/AppIcon';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AppModal({ visible, onClose, title, children, footer }: ModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityLabel={`Modal ${title || ''}`.trim()}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Fechar modal"
            accessibilityRole="button"
          >
            <AppIcon
            name="close"
            size={iconSizes.md}
            color="secondary"
          />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    padding: spacing.xxxxxxl,
    maxHeight: '80%',
    ...elevation.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxxxxxl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginBottom: spacing.xxxxxxl,
  },
  footer: {
    marginTop: spacing.xxxxxxl,
  },
});
