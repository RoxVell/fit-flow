"use client";

import { BarChart3, Dumbbell, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralTab } from "@/components/progress/general-tab";
import { ExercisesTab } from "@/components/progress/exercises-tab";
import { BodyTab } from "@/components/progress/body-tab";

export default function ProgressPage() {
  return (
    <div className="px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-2xl font-bold mb-4">Progress</h1>
      <Tabs defaultValue="general">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1"><BarChart3 className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="exercises" className="flex-1"><Dumbbell className="h-4 w-4" /> Exercises</TabsTrigger>
          <TabsTrigger value="body" className="flex-1"><User className="h-4 w-4" /> Body</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="exercises">
          <ExercisesTab />
        </TabsContent>
        <TabsContent value="body">
          <BodyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
