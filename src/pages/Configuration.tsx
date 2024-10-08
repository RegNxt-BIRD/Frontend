import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Columns, Database, PlusCircle, Table } from "lucide-react";

const Configuration = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Configuration</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome to the Configuration page. In the future, you'll be able to
        dynamically create and manage PostgreSQL tables, datasets, and columns.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2" />
              Configure Datasets
            </CardTitle>
            <CardDescription>Define a new dataset structure</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Easily create new datasets to organize your data efficiently.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> New Dataset
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Table className="mr-2" />
              Manage Tables
            </CardTitle>
            <CardDescription>Configure your PostgreSQL tables</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Add, edit, or remove tables to match your data requirements.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Manage Tables
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Columns className="mr-2" />
              Column Editor
            </CardTitle>
            <CardDescription>Customize table columns</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Fine-tune your data structure with custom column configurations.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              Edit Columns
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          We're working on bringing you powerful tools to create and manage your
          database configurations directly through this interface. Stay tuned
          for updates!
        </p>
      </div>
    </div>
  );
};

export default Configuration;
