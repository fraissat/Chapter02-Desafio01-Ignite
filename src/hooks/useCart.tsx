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
    if(storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`/stock/${productId}`);
      const updatedCart = [...cart];
      const actualProduct = updatedCart.find(product => product.id === productId);
      const actualProductAmount = actualProduct ? actualProduct.amount : 0;

      if (actualProductAmount + 1 > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      };

      if (actualProduct) {
        actualProduct.amount += 1;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {...product.data, amount: 1};
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const actualProduct = updatedCart.find(product => product.id === productId);
      const actualProductExists = actualProduct ? true : false;
      if (!actualProductExists) {throw "Error"} else {
        updatedCart.filter((product) => {
          return product.id != productId;
        })
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      };
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const stock = await api.get(`/stock/${productId}`);
      const actualProduct = updatedCart.find(product => product.id === productId);
      if (amount <= 0) {return};
      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (actualProduct) {
        actualProduct.amount = amount;
      } else { throw "Error" };

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

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

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
