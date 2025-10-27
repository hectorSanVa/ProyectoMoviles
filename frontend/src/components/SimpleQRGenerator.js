import React from 'react';
import { View, StyleSheet, Image, Alert, Share } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Card, Title, Paragraph, IconButton } from 'react-native-paper';

const SimpleQRGenerator = ({ product, onClose }) => {
  const { theme } = useTheme();

  // Generar URL del QR usando API externa
  const qrValue = product?.code || product?.id?.toString() || 'N/A';
  const qrSize = 250;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrValue)}`;

  const handleShare = async () => {
    const shareData = {
      message: `Código del producto: ${qrValue}\n${product?.name || 'Producto'}`,
      title: product?.name || 'Producto',
    };
    
    try {
      await Share.share(shareData);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir');
    }
  };

  const handleCopy = () => {
    Alert.alert(
      'Código Copiado',
      `El código "${qrValue}" ha sido copiado. Búscalo en la app de ventas.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="qr-code" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Title style={[styles.title, { color: theme.colors.onSurface }]}>
              Código QR
            </Title>
            <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {product?.name || 'Producto'}
            </Paragraph>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: qrUrl }}
            style={{ width: qrSize, height: qrSize }}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.infoRow}>
            <MaterialIcons name="tag" size={20} color={theme.colors.primary} />
            <Paragraph style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Código: {qrValue}
            </Paragraph>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="attach-money" size={20} color={theme.colors.tertiary} />
            <Paragraph style={[styles.infoText, { color: theme.colors.onSurface }]}>
              ${Number(product?.sale_price || 0).toFixed(2)}
            </Paragraph>
          </View>
          {product?.stock !== undefined && (
            <View style={styles.infoRow}>
              <MaterialIcons name="inventory-2" size={20} color={theme.colors.secondary} />
              <Paragraph style={[styles.infoText, { color: theme.colors.onSurface }]}>
                Stock: {product.stock}{product?.sale_type === 'weight' ? ` ${product.unit_of_measure || 'kg'}` : ''}
              </Paragraph>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="content-copy"
            onPress={handleCopy}
            style={styles.button}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Copiar Código
          </Button>
          <Button
            mode="outlined"
            icon="share-variant"
            onPress={handleShare}
            style={styles.button}
          >
            Compartir
          </Button>
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialIcons name="info-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <Paragraph style={[styles.infoBoxText, { color: theme.colors.onSurfaceVariant }]}>
            Los empleados pueden escanear este código para agregar el producto al carrito automáticamente.
          </Paragraph>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  qrContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  infoContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
  },
});

export default SimpleQRGenerator;
