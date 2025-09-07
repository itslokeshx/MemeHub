import DownloadButton from "./download-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Example component showing how to use the DownloadButton
 * with both direct URLs and meme IDs
 */
export default function DownloadExample() {
  // Example data - in real usage, this would come from your API
  const exampleMemes = [
    {
      id: "f43ab1af-f1d1-4441-b848-3bb45d280018",
      title: "Red pill or blue pill",
      imageUrl: "https://res.cloudinary.com/dg42qmwpz/image/upload/v1757155031/memes/ul45lixnugi2bz5pkofq.png",
      tags: ["Matrix"]
    },
    {
      id: "05bd24c0-2e3a-453c-8213-91fba6ee6199", 
      title: "Malak",
      imageUrl: "https://res.cloudinary.com/dg42qmwpz/image/upload/v1757126139/memes/jtn6frxasqwcq3c2mpir.png",
      tags: ["ghost", "nun", "malak"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Download Button Examples</h1>
        <p className="text-muted-foreground">
          Examples showing how to use the DownloadButton component with different props
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exampleMemes.map((meme) => (
          <Card key={meme.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{meme.title}</CardTitle>
              <div className="flex flex-wrap gap-1">
                {meme.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meme image */}
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={meme.imageUrl} 
                  alt={meme.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Download buttons */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Method 1: Direct URL</h4>
                  <DownloadButton 
                    imageUrl={meme.imageUrl}
                    filename={`${meme.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Method 2: Meme ID</h4>
                  <DownloadButton 
                    memeId={meme.id}
                    filename={`${meme.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Method 3: Auto filename</h4>
                  <DownloadButton 
                    imageUrl={meme.imageUrl}
                    size="sm"
                    className="w-auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. With direct image URL:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<DownloadButton 
  imageUrl="https://res.cloudinary.com/.../image.jpg"
  filename="my_meme.jpg"
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. With meme ID:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<DownloadButton 
  memeId="f43ab1af-f1d1-4441-b848-3bb45d280018"
  filename="meme.jpg"
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. With custom styling:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<DownloadButton 
  imageUrl={meme.imageUrl}
  size="sm"
  className="w-auto"
  showLoading={false}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
