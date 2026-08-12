import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

export const Route = createFileRoute("/dashboard/dokumente/")({
  component: DokumenteStartseite,
});

function DokumenteStartseite() {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed p-10 text-center">
      <div>
        <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Wählen Sie links ein Objekt aus, um Ordner anzulegen und Dokumente abzulegen.
        </p>
      </div>
    </div>
  );
}
