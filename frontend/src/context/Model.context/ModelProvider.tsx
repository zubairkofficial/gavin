import { type ReactNode,  useState } from "react";
import { ModelContext } from ".";

const ModelProvider = ({ children }: { children: ReactNode }) => {
  
  const [ModalOpen, setIsModalOpen] = useState(false)
  


  return (
    <ModelContext.Provider
      value={{
        ModalOpen, setIsModalOpen
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;