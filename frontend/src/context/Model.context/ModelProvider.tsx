import { type ReactNode,  useState } from "react";
import { ModelContext } from ".";

const ModelProvider = ({ children }: { children: ReactNode }) => {
  
  const [ModalOpen, setIsModalOpen] = useState(false)
  const [Modalvalue, setIsModalvalue] = useState<any>(null)
  


  return (
    <ModelContext.Provider
      value={{
        ModalOpen, setIsModalOpen ,Modalvalue, setIsModalvalue
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;