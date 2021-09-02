import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
    
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedProduct = [...cart];

      const productExists = updatedProduct.find(product => productId === product.id);

      const { data } = await api.get<Stock>(`stock/${productId}`);
      
      const stock = data.amount;

      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists) {
        productExists.amount = amount;
        
      } else {
        const response = await api.get(`products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1
        }
        updatedProduct.push(newProduct);
      }

      setCart(updatedProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProduct));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = [...cart];

      const productExists = products.findIndex(product => product.id === productId);

      if(productExists === -1) throw Error();

      products.splice(productExists, 1);

      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0) return 

      const { data: productStock } = await api.get<Stock>(`stock/${productId}`);

      if(amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const copyCart = [...cart];

      const indexProduct = copyCart.findIndex(product => product.id === productId);

      copyCart[indexProduct].amount = amount;

      setCart(copyCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  return context;
}
