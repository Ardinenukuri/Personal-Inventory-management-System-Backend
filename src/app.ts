import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import stockRoutes from './routes/stock.routes';
import adminRoutes from './routes/admin.routes';


dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log('--- A Request Has Arrived! ---');
    console.log('URL:', req.url);
    console.log('Headers:', req.headers); 
    console.log('Body:', req.body);      
    console.log('---------------------------');
    next(); 
});


app.get('/', (req, res) => {
    res.send('Inventory Management API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes); 
app.use('/api/stock', stockRoutes);
app.use('/api/admin', adminRoutes);


export default app;