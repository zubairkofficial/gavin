import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AuthProvider from "./context/Auth.context/AuthProvider";
import AppRouter from "./routes";
import ModelProvider from "./context/Model.context/ModelProvider";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ModelProvider>

        <AppRouter />
      </ModelProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
