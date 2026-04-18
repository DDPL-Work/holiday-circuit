import { RouterProvider } from "react-router-dom";
import { appRouter } from "./Route";

export default function AppRouter(){
    return <RouterProvider router={appRouter} />;
}