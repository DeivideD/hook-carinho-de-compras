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
      const storageProduct: Stock = await api.get(`stock/${productId}`).then(response => response.data)
      const porduct = cart.find(item => item.id === productId) 
      const productAmount = porduct === undefined ? 0 : porduct.amount + 1;
      const updatedCart = cart.filter(item => item.id !== productId)
 
      if( storageProduct.amount < productAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if( porduct !== undefined ){
        porduct.amount += 1;
        updatedCart.push(porduct)
      }else{
        const findPorduct: Product = await api.get(`products/${productId}`).then( response => response.data);
        findPorduct.amount = 1;
        updatedCart.push(findPorduct);
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      toast.success('Produto adcionado ao carrinho');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const poroduct = cart.find(item => item.id === productId); 
      const updatedCart = cart.filter(product => product.id !== productId)
      if(poroduct === undefined){
        toast.error("Erro na remoção do produto");
        return;
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      toast.error(`${poroduct?.title || 'Produto'} removido do carrinho`);

    } catch {
      toast.error(`Erro na remoção do produto`);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const storageProduct: Stock = await api.get(`stock/${productId}`).then(response => response.data)
      const porduct = cart.find(item => item.id === productId) 
      const updatedCart = cart.filter(item => item.id !== productId)

      if (amount < 1) {
        return;
      }

      if (storageProduct.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      porduct!.amount = amount;
      updatedCart.push(porduct!)

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
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
