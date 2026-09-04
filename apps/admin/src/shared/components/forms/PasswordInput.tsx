import { Eye, EyeOff } from "lucide-react";
import { type ComponentPropsWithoutRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const PasswordInput = (
  props: ComponentPropsWithoutRef<typeof Input>,
) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className="bg-white pr-10"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};
