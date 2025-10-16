import { LoaderPinwheel } from "lucide-react";

const FullscreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center">
        <LoaderPinwheel className="w-12 h-12 text-white animate-spin" />
        <p className="mt-4 text-sm text-white/80">Loading, please wait...</p>
      </div>
    </div>
  );
};

export default FullscreenLoader;
