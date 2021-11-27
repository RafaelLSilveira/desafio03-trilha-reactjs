import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`/stock/${productId}`)
      const plusProduct = cart.find((item) => item.id === productId)
      if(plusProduct) {
        if(plusProduct.amount >= data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        plusProduct.amount += 1

        const restCart = cart.filter((item) => item.id !== productId)
        const updateProductAmount = [...restCart, plusProduct]
        setCart(updateProductAmount)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProductAmount))
      } else {
        api.get(`/products/${productId}`).then(({data}) => {
          if(!data) {
            toast.error('Erro na adição do produto');
            return
          }

          const newPlusProduct = data

          newPlusProduct.amount = 1

          if(newPlusProduct.amount > data.amount) {
            toast.error('Quantidade solicitada fora de estoque');
          }

          const updateProductAmount = [...cart, newPlusProduct]
          setCart(updateProductAmount)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProductAmount))
        })
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartProduct = cart.find(item => (item.id === productId))
      if(!cartProduct) {
        toast.error('Erro na remoção do produto');
        return
      }

      const newCart = cart.filter(item => (item.id !== productId))
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`)

      if(amount <= 0) {
        return
      }

      if(!amount || amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCart = cart.map(item => {
        if(productId === item.id) {
          item.amount = amount
        }

        return item
      })

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
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
