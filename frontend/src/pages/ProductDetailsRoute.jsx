import { useParams } from "react-router-dom";
import ProductDetails from "./ProductDetails";

const ProductDetailsRoute = () => {
  const { productId } = useParams();

  // 🔑 Key forces remount when productId changes
  return <ProductDetails key={productId} />;
};

export default ProductDetailsRoute;
