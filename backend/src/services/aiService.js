/**
 * Servicio de IA gratuito usando Hugging Face Inference API
 * Modelo: gpt2 en español (gratuito, sin límites)
 */
const fetch = require('node-fetch');
const config = require('../config/config');

/**
 * Procesa una pregunta usando IA gratuita
 * @param {string} question - La pregunta del usuario
 * @param {object} context - Contexto del sistema (cart, sales, etc.)
 * @returns {Promise<object>} La respuesta del AI
 */
async function processAIQuestion(question, context = {}) {
  console.log('🤖 Procesando pregunta:', question);
  console.log('🔑 Token Hugging Face configurado:', config.huggingface.apiKey ? 'SÍ' : 'NO');
  console.log('🔑 Longitud del token:', config.huggingface.apiKey ? config.huggingface.apiKey.length : 0);
  
  // Si tenemos API key de Hugging Face, intentar usarla
  if (config.huggingface.apiKey && config.huggingface.apiKey.length > 0) {
    try {
      console.log('🔍 Intentando usar IA real de Hugging Face...');
      console.log('🌐 Modelo:', config.huggingface.model);
      console.log('🌐 URL:', `${config.huggingface.apiUrl}/${config.huggingface.model}`);
      
      const aiResponse = await callHuggingFaceAPI(question, context);
      
      if (aiResponse && aiResponse.text) {
        console.log('✅ Respuesta de IA REAL obtenida:', aiResponse.text.substring(0, 100));
        return aiResponse;
      } else {
        console.log('⚠️  IA no devolvió respuesta válida, usando fallback');
      }
    } catch (error) {
      console.error('❌ Error con Hugging Face API:', error.message);
      console.log('⚠️  Fallback a reglas locales');
    }
  } else {
    console.log('⚠️  No hay token de Hugging Face configurado, usando reglas locales');
  }
  
  // Usar sistema inteligente como respuesta principal o fallback
  console.log('🔍 Usando sistema inteligente contextual...');
  try {
    const smartResponse = await processSmartRules(question, context);
    
    if (smartResponse) {
      console.log('✅ Respuesta inteligente obtenida');
      return smartResponse;
    }
  } catch (error) {
    console.log('⚠️  Usando reglas básicas:', error.message);
  }
  
  // Fallback final a reglas básicas
  console.log('🔍 Usando reglas básicas (fallback final)');
  return processBasicRules(question, context);
}

/**
 * Llama a la API de Hugging Face para obtener respuesta con IA
 */
async function callHuggingFaceAPI(question, context) {
  try {
    const { cart, total, todayStats } = context;
    
    // Crear contexto para la IA (formato para flan-t5-base)
    const contextPrompt = `Eres un asistente de tienda. Responde brevemente en español.

Pregunta: ${question}

Contexto: Carrito tiene ${cart?.length || 0} productos. Total: $${total || 0}. Ventas hoy: ${todayStats?.total_sales || 0}.

Respuesta:`;

    console.log('📤 Enviando request a Hugging Face...');
    console.log('📝 Prompt:', contextPrompt.substring(0, 200) + '...');
    console.log('🌐 URL completa:', `${config.huggingface.apiUrl}/${config.huggingface.model}`);

    const response = await fetch(
      `${config.huggingface.apiUrl}/${config.huggingface.model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.huggingface.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: contextPrompt,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
          },
        }),
      }
    );

    console.log('📥 Status de respuesta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de Hugging Face:', errorText);
      
      // Si el modelo está en "cold start" (503), esperar un poco y reintentar
      if (response.status === 503) {
        console.log('⏳ Modelo en cold start, esperando 10 segundos...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Reintentar una vez
        console.log('🔄 Reintentando...');
        const retryResponse = await fetch(
          `${config.huggingface.apiUrl}/${config.huggingface.model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.huggingface.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: contextPrompt,
              parameters: {
                max_length: 150,
                temperature: 0.8,
                top_p: 0.9,
                return_full_text: false,
              },
            }),
          }
        );
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          console.log('✅ Respuesta después del reintento recibida');
          // Procesar respuesta del reintento
          let aiText = '';
          if (Array.isArray(retryData)) {
            aiText = retryData[0]?.generated_text || '';
          } else if (retryData.generated_text) {
            aiText = retryData.generated_text;
          }
          
          if (aiText && aiText.length > 0) {
            if (aiText.includes('Usuario:')) {
              const parts = aiText.split('Asistente:');
              if (parts.length > 1) {
                aiText = parts[parts.length - 1].trim();
              }
            }
            return {
              text: aiText.trim(),
              speak: aiText.trim().substring(0, 100),
            };
          }
        }
      }
      
      throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta de Hugging Face recibida:', JSON.stringify(data).substring(0, 200));
    
    // Extraer la respuesta del formato de Hugging Face
    let aiText = '';
    if (Array.isArray(data)) {
      aiText = data[0]?.generated_text || '';
    } else if (data.generated_text) {
      aiText = data.generated_text;
    } else if (data[0]?.generated_text) {
      aiText = data[0].generated_text;
    }
    
    // Limpiar el texto (remover el prompt original si está incluido)
    if (aiText && aiText.includes('Usuario:')) {
      const parts = aiText.split('Asistente:');
      if (parts.length > 1) {
        aiText = parts[parts.length - 1].trim();
      }
    }
    
    if (aiText && aiText.length > 0) {
      console.log('✅ Texto extraído de IA:', aiText.substring(0, 100));
      return {
        text: aiText.trim(),
        speak: aiText.trim().substring(0, 100), // Limitar para TTS
      };
    }
    
    console.log('⚠️  No se pudo extraer texto de la respuesta');
    return null;
  } catch (error) {
    console.error('❌ Error llamando a Hugging Face:', error.message);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
}

/**
 * Sistema inteligente que consulta datos reales del proyecto
 */
async function processSmartRules(question, context) {
  const lower = question.toLowerCase();
  const { cart, todayStats, products } = context;
  
  // Preguntas sobre stock actual (muchas variaciones)
  if (lower.includes('stock') || lower.includes('inventario') || lower.includes('cantidad') || 
      (lower.includes('hay') && lower.includes('producto')) || lower.includes('mercancia') || 
      lower.includes('artículos') || lower.includes('items') || lower.includes('existencias') ||
      lower.includes('disponible') || lower.includes('almacen') || lower.includes('bodega')) {
    if (products && Array.isArray(products)) {
      const lowStock = products.filter(p => (p.stock || 0) <= (p.min_stock || 0)).length;
      const totalProducts = products.length;
      
      return {
        text: `📦 ESTADO DEL INVENTARIO:\n\n• Total de productos: ${totalProducts}\n• Con stock bajo: ${lowStock}\n• En carrito: ${cart?.length || 0}\n\n¿Quieres ver algún producto específico?`,
        speak: `${totalProducts} productos, ${lowStock} con stock bajo`,
      };
    }
  }
  
  // Preguntas sobre productos específicos (muchas variaciones)
  if ((lower.includes('producto') || lower.includes('articulo') || lower.includes('item') || lower.includes('mercanci')) && 
      (lower.includes('tienes') || lower.includes('hay') || lower.includes('muestra') || 
       lower.includes('dime') || lower.includes('lista') || lower.includes('disponibles') ||
       lower.includes('existe') || lower.includes('ofreces') || lower.includes('cuenta') ||
       lower.includes('tengo') || lower.includes('tiene'))) {
    if (products && Array.isArray(products) && products.length > 0) {
      const top5 = products.slice(0, 5).map(p => `• ${p.name} - Stock: ${p.stock || 0}`).join('\n');
      return {
        text: `📦 PRODUCTOS DISPONIBLES:\n\n${top5}\n\n...y ${products.length - 5} más\n\n¿Buscas algo específico?`,
        speak: `${products.length} productos disponibles`,
      };
    }
  }
  
  // Preguntas sobre ventas (muchas variaciones)
  if (lower.includes('venta') || lower.includes('ventas') || 
      lower.includes('dinero') || lower.includes('ingreso') ||
      lower.includes('ingresos') || lower.includes('ingresado') ||
      (lower.includes('cuanto') && lower.includes('vendido')) || 
      (lower.includes('cuanto') && lower.includes('hecho')) ||
      lower.includes('facturacion') || lower.includes('facturación')) {
    if (todayStats) {
      return {
        text: `💰 VENTAS DEL DÍA:\n\n• Total: $${(todayStats.total_amount || 0).toFixed(2)}\n• Cantidad: ${todayStats.total_sales || 0} ventas\n• Promedio: $${((todayStats.total_amount || 0) / (todayStats.total_sales || 1)).toFixed(2)}`,
        speak: `${todayStats.total_sales || 0} ventas`,
      };
    }
  }
  
  // Preguntas sobre consejos de venta
  if (lower.includes('consejo') || lower.includes('recomendac') || lower.includes('sugerencia')) {
    return {
      text: `💡 CONSEJOS DE VENTA:\n\n• Sugiere productos complementarios\n• Destaca las ofertas activas\n• Ofrece paquetes o combos\n• Menciona beneficios del producto\n• Crea urgencia con stock limitado\n\n¿Necesitas ayuda con algo específico?`,
      speak: null,
    };
  }
  
  // Preguntas sobre estrategias
  if (lower.includes('estrategia') || lower.includes('técnica') || lower.includes('mejora')) {
    return {
      text: `📈 ESTRATEGIAS DE VENTA:\n\n• Personaliza la experiencia del cliente\n• Destaca las promociones del día\n• Sugiere upsells (productos complementarios)\n• Aprovecha el cross-selling\n• Menciona ventajas competitivas\n\n¿Quieres profundizar en alguna?`,
      speak: null,
    };
  }
  
  // Preguntas sobre atención al cliente
  if (lower.includes('atencion') && lower.includes('cliente') && !lower.includes('diabetic')) {
    return {
      text: `👥 ATENCIÓN AL CLIENTE:\n\n• Saluda con amabilidad\n• Escucha activamente\n• Brinda información útil\n• Mantén contacto visual\n• Ofrece soluciones claras\n• Despide con una sonrisa\n\n¿Necesitas más consejos?`,
      speak: null,
    };
  }
  
  // Preguntas médicas/salud (diabetes, alergias, etc.)
  if (lower.includes('diabetic') || lower.includes('diabetes') || lower.includes('diabético')) {
    return {
      text: `⚠️ ATENCIÓN - PRODUCTOS PARA DIABÉTICOS:\n\n❌ Debe evitar:\n• Azúcar refinada\n• Productos con alto contenido de carbohidratos simples\n• Alimentos procesados con mucha azúcar\n• Refrescos y bebidas azucaradas\n• Dulces y chocolates con azúcar\n\n✅ Puede consumir:\n• Productos sin azúcar agregada\n• Frutas naturales\n• Verduras frescas\n• Alimentos bajos en carbohidratos\n\n💡 IMPORTANTE: Siempre recomienda consultar con un médico.\n\n¿Qué productos específicos buscas para ofrecerle?`,
      speak: 'Puede ofrecer productos sin azúcar',
    };
  }
  
  if (lower.includes('alergi') || lower.includes('intoleran')) {
    return {
      text: `⚠️ ATENCIÓN - ALERGIAS E INTOLERANCIAS:\n\n• Pregunta siempre sobre alergias antes de recomendar\n• Evita productos con alérgenos comunes:\n  - Gluten\n  - Lactosa\n  - Frutos secos\n  - Mariscos\n\n💡 IMPORTANTE: Lee siempre las etiquetas y consulta al cliente.\n\n¿Hay algún producto específico que pueda ayudarte a localizar?`,
      speak: null,
    };
  }
  
  if (lower.includes('salud') || lower.includes('nutricion') || lower.includes('calorias')) {
    return {
      text: `🥗 INFORMACIÓN NUTRICIONAL:\n\n• Siempre consulta las etiquetas nutricionales\n• Ofrece opciones más saludables cuando sea posible\n• Respeta las preferencias del cliente\n• Proporciona información sobre ingredientes\n\n¿Buscas algún producto específico con características saludables?`,
      speak: null,
    };
  }
  
  return null;
}

/**
 * Procesa la pregunta con reglas básicas (fallback)
 */
function processBasicRules(question, context) {
  const lower = question.toLowerCase();
  const { total, cart, todayStats } = context;
  
  // Calcular cambios
  if (lower.includes('cambio') || lower.includes('devuelvo')) {
    const match = question.match(/(\d+)/);
    if (match) {
      const paid = parseFloat(match[1]);
      const change = paid - total;
      
      if (change < 0) {
        return {
          text: `❌ Necesitas cobrar ${Math.abs(change).toFixed(2)} pesos más.`,
          speak: `Necesitas cobrar ${Math.abs(change).toFixed(2)} pesos más`,
        };
      }
      
      const pesos = Math.floor(change);
      const centavos = Math.round((change - pesos) * 100);
      let text = `💰 CAMBIO: ${pesos} pesos`;
      if (centavos > 0) text += ` con ${centavos} centavos`;
      text += `\nTotal: $${change.toFixed(2)}`;
      
      return {
        text,
        speak: centavos > 0 ? `${pesos} pesos con ${centavos} centavos` : `${pesos} pesos`,
      };
    }
    return {
      text: `💰 Total: $${total.toFixed(2)}\n\nEscribe "cambio 500" para calcular.`,
      speak: `Total: ${total.toFixed(2)} pesos`,
    };
  }
  
  // Ver total (solo si preguntan por el carrito)
  if ((lower.includes('total') && lower.includes('carrito')) || 
      (lower.includes('cuánto') && lower.includes('carrito'))) {
    if (cart?.length === 0) {
      return {
        text: '🛒 El carrito está vacío.',
        speak: 'Carrito vacío',
      };
    }
    return {
      text: `💰 TOTAL DEL CARRITO: $${total.toFixed(2)}\n\nProductos: ${cart.length}`,
      speak: `Total del carrito: ${total.toFixed(2)} pesos`,
    };
  }
  
  // Ventas del día
  if (lower.includes('venta') && lower.includes('día')) {
    return {
      text: `📊 VENTAS DEL DÍA\n\nTotal: ${todayStats?.total_sales || 0}\nIngresos: $${(todayStats?.total_amount || 0).toFixed(2)}`,
      speak: null,
    };
  }
  
  // Stock bajo
  if (lower.includes('stock') && lower.includes('bajo')) {
    return {
      text: `⚠️ ${todayStats?.low_stock_products || 0} productos con stock bajo.`,
      speak: `${todayStats?.low_stock_products || 0} productos con stock bajo`,
    };
  }
  
  // Saludo
  if (lower.includes('hola') || lower.includes('hi')) {
    return {
      text: '¡Hola! 👋 Soy tu asistente AI (IA).\n\n¿En qué puedo ayudarte?',
      speak: 'Hola',
    };
  }
  
  // Ayuda
  if (lower.includes('ayuda')) {
    return {
      text: `💡 COMANDOS:\n\n💰 "cambio 500"\n📊 "ventas hoy"\n⚠️ "stock bajo"\n\nO pregúntame cualquier cosa.`,
      speak: 'Comandos disponibles',
    };
  }
  
  // Preguntas sobre productos
  if (lower.includes('producto') || lower.includes('productos')) {
    if (lower.includes('tienes') || lower.includes('hay') || lower.includes('lista')) {
      return {
        text: '📦 PRODUCTOS DISPONIBLES\n\nTu carrito tiene:\n\n' + 
              (cart?.length > 0 
                ? cart.map(item => `• ${item.name} - ${item.quantity || item.weight} ${item.sale_type === 'weight' ? item.unit_of_measure || 'kg' : 'unidades'}`).join('\n')
                : '🛒 El carrito está vacío.\n\nAgrega productos desde la pantalla de ventas.'),
        speak: null,
      };
    }
    if (lower.includes('más vendido') || lower.includes('popular')) {
      return {
        text: '📊 PRODUCTOS MÁS VENDIDOS\n\nPuedes revisar los productos más vendidos en la sección de "Reportes" del menú.\n\n¿Te ayudo con algo más?',
        speak: null,
      };
    }
  }

  // Preguntas sobre recomendaciones
  if (lower.includes('recomendac') || lower.includes('consejo') || lower.includes('sugerencia')) {
    return {
      text: '💡 RECOMENDACIONES\n\n• Sugiere productos con descuento\n• Ofrece paquetes o combos\n• Promociona productos de temporada\n• Muestra productos relacionados\n\n¿Necesitas ayuda con algo más?',
      speak: null,
    };
  }
  
  // Preguntas sobre cómo usar el sistema
  if (lower.includes('como') || lower.includes('cómo') || lower.includes('como se')) {
    return {
      text: '💡 CÓMO USAR EL SISTEMA:\n\n• Agrega productos al carrito\n• Calcula cambios con "cambio X"\n• Ve ventas del día\n• Consulta el stock\n• Revisa reportes\n\n¿Qué necesitas hacer?',
      speak: null,
    };
  }
  
  // Preguntas sobre precio
  if (lower.includes('precio') || lower.includes('cuesta') || lower.includes('vale')) {
    if (cart && cart.length > 0) {
      const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
      return {
        text: `💰 PRECIO DEL CARRITO: $${cartTotal.toFixed(2)}\n\nProductos: ${cart.length}\n\n¿Quieres calcular el cambio? Escribe "cambio X"`,
        speak: `Total: ${cartTotal.toFixed(2)} pesos`,
      };
    }
    return {
      text: '💰 El carrito está vacío. Agrega productos primero.',
      speak: 'Carrito vacío',
    };
  }
  
  // Respuesta por defecto
  return {
    text: '🤔 No entendí completamente.\n\nPrueba con:\n• "cambio 500"\n• "ventas hoy"\n• "stock bajo"\n• "productos disponibles"\n\nO usa "ayuda" para ver comandos.',
    speak: null,
  };
}

module.exports = {
  processAIQuestion,
};
