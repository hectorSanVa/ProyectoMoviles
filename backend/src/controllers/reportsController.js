const { query } = require('../config/database');

const reportsController = {
  // Reporte de ventas por día
  getDailySales: async (req, res) => {
    try {
      const { date } = req.query;
      // Usar fecha local en lugar de UTC
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const targetDate = date || localDate.toISOString().split('T')[0];
      
      const result = await query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_sales,
          SUM(total) as total_amount,
          AVG(total) as average_amount
        FROM sales 
        WHERE DATE(created_at) = $1
        GROUP BY DATE(created_at)
      `, [targetDate]);

      res.json({
        success: true,
        data: result.rows[0] || {
          date: targetDate,
          total_sales: 0,
          total_amount: 0,
          average_amount: 0
        }
      });
    } catch (error) {
      console.error('Error obteniendo ventas diarias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Top productos más vendidos
  getTopProducts: async (req, res) => {
    try {
      const { limit = 10, days = 7 } = req.query;
      
      const result = await query(`
        SELECT 
          p.name,
          p.code,
          p.sale_price,
          SUM(si.quantity) as total_quantity,
          SUM(si.quantity * si.unit_price) as total_revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY p.id, p.name, p.code, p.sale_price
        ORDER BY total_quantity DESC
        LIMIT $1
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo top productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Productos con stock bajo
  getLowStockProducts: async (req, res) => {
    try {
      const result = await query(`
        SELECT 
          id,
          name,
          code,
          stock,
          min_stock,
          sale_price
        FROM products 
        WHERE stock > 0 AND stock < min_stock AND is_active = true
        ORDER BY (stock - min_stock) ASC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo stock bajo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Resumen general
  getSummary: async (req, res) => {
    try {
      // Usar fecha local en lugar de UTC
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const todayStr = localDate.toISOString().split('T')[0];
      
      // Ventas del día
      const dailySales = await query(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_amount
        FROM sales 
        WHERE DATE(created_at) = $1
      `, [todayStr]);

      // Calcular ganancias del día (precio de venta - precio de compra)
      const profit = await query(`
        SELECT 
          COALESCE(SUM(si.quantity * (p.sale_price - p.purchase_price)), 0) as total_profit
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) = $1
      `, [todayStr]);

      // Total de productos
      const totalProducts = await query(`
        SELECT COUNT(*) as count FROM products WHERE is_active = true
      `);

      // Productos con stock bajo (solo los que tienen stock > 0 y < min_stock)
      const lowStock = await query(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE stock > 0 AND stock < min_stock AND is_active = true
      `);

      res.json({
        success: true,
        data: {
          daily_sales: dailySales.rows[0],
          daily_profit: profit.rows[0].total_profit,
          total_products: totalProducts.rows[0].count,
          low_stock_products: lowStock.rows[0].count
        }
      });
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = reportsController;
