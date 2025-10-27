import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Modal, TouchableOpacity, Animated, Platform } from 'react-native';
import { Button, Paragraph, IconButton, Card, FAB, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { voiceSearchService } from '../services/voiceSearchService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CashierAssistant = ({ total, cart, todayStats, products }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '¡Hola! 👋 Soy tu asistente AI.\n\nPuedo ayudarte con:\n💰 Calcular cambios\n📊 Ver ventas del día\n⚠️ Revisar stock bajo\n🔔 Alertar productos vencidos\n\nUsa "ayuda" para ver comandos o pregúntame de forma natural.',
      from: 'bot',
    }
  ]);
  
  // Animación al abrir el modal
  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [isOpen]);

  const askAI = (q) => {
    const lower = q.toLowerCase();
    
    if (lower.includes('cambio') || lower.includes('devuelvo') || lower.includes('devolvi')) {
      const match = q.match(/(\d+)/);
      if (match) {
        const paid = parseFloat(match[1]);
        const change = paid - total;
        
        if (change < 0) {
          return {
            text: `❌ El total es $${total.toFixed(2)}\n\nNecesitas cobrar ${Math.abs(change).toFixed(2)} pesos más.`,
            speak: `Necesitas cobrar ${Math.abs(change).toFixed(2)} pesos más`,
          };
        }
        
        if (change === 0) {
          return {
            text: `✅ Pago exacto.\n\nTotal: $${total.toFixed(2)}`,
            speak: 'Pago exacto',
          };
        }
        
        const pesos = Math.floor(change);
        const centavos = Math.round((change - pesos) * 100);
        let text = `💰 CAMBIO A DAR:\n\nTotal: $${total.toFixed(2)}\nRecibido: $${paid.toFixed(2)}\n\nCambio: ${pesos} pesos`;
        if (centavos > 0) text += ` con ${centavos} centavos`;
        text += `\n\nTotal: $${change.toFixed(2)}`;
        
        return {
          text,
          speak: centavos > 0 ? `${pesos} pesos con ${centavos} centavos` : `${pesos} pesos`,
        };
      }
      return {
        text: `💰 Tu total actual es: $${total.toFixed(2)}\n\n¿Cuánto te van a pagar?\n\nEjemplo: "cambio 500"`,
        speak: `Total: ${total.toFixed(2)} pesos`,
      };
    }
    
    if (lower.includes('total') || lower.includes('cuánto') || lower.includes('cuanto')) {
      if (cart.length === 0) {
        return {
          text: '🛒 Tu carrito está vacío.',
          speak: 'Carrito vacío',
        };
      }
      return {
        text: `💰 TOTAL\n\nProductos: ${cart.length}\nSubtotal: $${(total / 1.16).toFixed(2)}\nIVA (16%): $${(total * 0.16 / 1.16).toFixed(2)}\n\nTotal: $${total.toFixed(2)}`,
        speak: `Total: ${total.toFixed(2)} pesos`,
      };
    }
    
    if (lower.includes('venta') && (lower.includes('día') || lower.includes('hoy'))) {
      return {
        text: `📊 VENTAS\n\nTotal: ${todayStats?.total_sales || 0}\nIngresos: $${(todayStats?.total_amount || 0).toFixed(2)}`,
        speak: null,
      };
    }
    
    if (lower.includes('stock') || lower.includes('bajo')) {
      const count = todayStats?.low_stock_products || 0;
      return {
        text: `⚠️ STOCK BAJO\n\nHay ${count} productos con stock bajo.`,
        speak: `Hay ${count} productos con stock bajo`,
      };
    }
    
    if (lower.includes('vencido') || lower.includes('vencimiento')) {
      return {
        text: `🚨 PRODUCTOS VENCIDOS\n\nRevisa la sección de Alertas de Vencimiento en Config.`,
        speak: 'Revisa productos vencidos',
      };
    }
    
    if (lower.includes('hola') || lower.includes('hi')) {
      return {
        text: `¡Hola! 👋 Soy tu asistente.\n\nPuedo ayudarte a:\n💰 Calcular cambios\n📊 Ver ventas\n⚠️ Revisar stock\n🔔 Alertar vencidos`,
        speak: 'Hola',
      };
    }
    
    if (lower.includes('ayuda') || lower.includes('ayúdame')) {
      return {
        text: `💡 COMANDOS:\n\n💰 "cambio 500"\n📊 "ventas hoy"\n⚠️ "stock bajo"\n🔔 "vencidos"`,
        speak: 'Ejemplos de comandos',
      };
    }
    
    return {
      text: `🤔 No entendí.\n\nUsa "ayuda" para ver comandos.`,
      speak: null,
    };
  };

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: question,
      from: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion('');
    setIsLoading(true);

    try {
      // Usar IA gratuita de Hugging Face
      const token = await AsyncStorage.getItem('token');
      const apiUrl = 'https://inventario-api-7amo.onrender.com';
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: currentQuestion,
          total,
          cart,
          todayStats,
          products,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage = {
          id: Date.now() + 1,
          text: data.text,
          from: 'bot',
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (data.speak) {
          voiceSearchService.speak(data.speak);
        }
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error con AI:', error);
      // Fallback a reglas locales
      const response = askAI(currentQuestion);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        from: 'bot',
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.speak) {
        voiceSearchService.speak(response.speak);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <FAB
          icon="robot"
          style={styles.fab}
          onPress={() => setIsOpen(true)}
        />
      )}

      {/* Modal del chat */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer, 
              { 
                backgroundColor: theme.colors.background,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarContainer}>
                  <MaterialIcons name="smart-toy" size={28} color="#fff" />
                </View>
                <View>
                  <Paragraph style={styles.headerText}>Asistente IA</Paragraph>
                  <Paragraph style={styles.headerSubtitle}>Online</Paragraph>
                </View>
              </View>
              <IconButton
                icon="close"
                iconColor="#fff"
                size={24}
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              />
            </View>

            {/* Mensajes */}
            <ScrollView style={styles.messagesList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.from === 'user' ? styles.userMessage : styles.botMessage,
                    {
                      backgroundColor: msg.from === 'user' ? theme.colors.primary : theme.colors.surfaceContainer,
                    }
                  ]}
                >
                  <Paragraph
                    style={[
                      styles.messageText,
                      { color: msg.from === 'user' ? '#fff' : theme.colors.onSurface }
                    ]}
                  >
                    {msg.text}
                  </Paragraph>
                  <View style={[styles.messageTime, { color: msg.from === 'user' ? '#fff' : theme.colors.onSurfaceVariant }]}>
                    <MaterialIcons 
                      name={msg.from === 'user' ? 'done-all' : 'smart-toy'} 
                      size={12} 
                      color={msg.from === 'user' ? '#fff' : theme.colors.onSurfaceVariant} 
                    />
                  </View>
                </View>
              ))}
              
              {isLoading && (
                <View style={[styles.messageBubble, styles.botMessage, { 
                  backgroundColor: theme.colors.surfaceContainer,
                  borderBottomLeftRadius: 4,
                }]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Paragraph style={[styles.messageText, { color: theme.colors.onSurface, marginLeft: 8 }]}>
                    Pensando...
                  </Paragraph>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface }]}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Escribe tu pregunta..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                style={[styles.input, { color: theme.colors.onSurface }]}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!question.trim() || isLoading}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: question.trim() && !isLoading ? theme.colors.primary : theme.colors.surfaceContainer,
                    opacity: question.trim() && !isLoading ? 1 : 0.5,
                  }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="send" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  closeButton: {
    margin: 0,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: '80%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 15,
    ...Platform.select({
      ios: {
        paddingTop: 10,
        paddingBottom: 10,
      },
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default CashierAssistant;
