import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AlertsPage() {
  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <PageHeader title="Alerts" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Configure Alerts</CardTitle>
                <CardDescription>
                  Get email notifications for specific changes in the UCS index.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="condition">Condition</Label>
                      <Select>
                        <SelectTrigger id="condition">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Rises Above</SelectItem>
                          <SelectItem value="below">Drops Below</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="threshold">Index Value</Label>
                      <Input id="threshold" type="number" placeholder="e.g., 105.50" />
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" type="submit">Create Alert</Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8">
                 <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
                 <Card>
                     <CardContent className="p-0">
                         <div className="p-6 flex items-center justify-between border-b">
                             <div>
                                 <p className="font-medium">Notify when index <span className="font-bold text-destructive">drops below 98.00</span></p>
                                 <p className="text-sm text-muted-foreground">Sending to you@example.com</p>
                             </div>
                             <Button variant="outline" size="sm">Delete</Button>
                         </div>
                         <div className="p-6 flex items-center justify-between">
                             <div>
                                <p className="font-medium">Notify when index <span className="font-bold text-primary">rises above 110.00</span></p>
                                <p className="text-sm text-muted-foreground">Sending to you@example.com</p>
                             </div>
                              <Button variant="outline" size="sm">Delete</Button>
                         </div>
                     </CardContent>
                 </Card>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
