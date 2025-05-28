import { createContext, useContext } from "react";

export interface ModelContextType {
  
  ModalOpen : boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ModelContext = createContext<ModelContextType>({
 ModalOpen: false,
  setIsModalOpen: () => {},

});


export function useModel() {
  if (!ModelContext) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return useContext(ModelContext);
}