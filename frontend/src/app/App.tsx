import { AppRouter } from "../router/AppRouter";
import { ToastContainer } from "../components/Toast";

export function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

