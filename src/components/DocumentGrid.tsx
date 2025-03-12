
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, CalendarIcon, FileText, MoreHorizontal, FolderIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Sample document data for demo
const DOCUMENTS = [
  {
    id: '1',
    title: 'Cours de Mathématiques - Fonctions',
    category: 'Mathématiques',
    type: 'PDF',
    uploadDate: '2023-05-15',
  },
  {
    id: '2',
    title: 'Introduction à la Physique Quantique',
    category: 'Physique',
    type: 'DOCX',
    uploadDate: '2023-05-10',
  },
  {
    id: '3',
    title: 'Littérature Française - Le Romantisme',
    category: 'Littérature',
    type: 'PDF',
    uploadDate: '2023-05-08',
  },
  {
    id: '4',
    title: 'Guide de programmation Python',
    category: 'Informatique',
    type: 'PDF',
    uploadDate: '2023-05-05',
  },
  {
    id: '5',
    title: 'Histoire - La Révolution Française',
    category: 'Histoire',
    type: 'PPTX',
    uploadDate: '2023-05-03',
  },
  {
    id: '6',
    title: 'Exercices de Biologie Cellulaire',
    category: 'Biologie',
    type: 'PDF',
    uploadDate: '2023-04-28',
  },
  {
    id: '7',
    title: 'Cours de Philosophie - L\'existentialisme',
    category: 'Philosophie',
    type: 'PDF',
    uploadDate: '2023-04-25',
  },
  {
    id: '8',
    title: 'Annales de Géographie',
    category: 'Géographie',
    type: 'PDF',
    uploadDate: '2023-04-20',
  },
];

// Type mapping for file types
const typeColorMap: Record<string, string> = {
  PDF: 'bg-red-100 text-red-800',
  DOCX: 'bg-blue-100 text-blue-800',
  PPTX: 'bg-orange-100 text-orange-800',
  XLSX: 'bg-green-100 text-green-800',
  TXT: 'bg-gray-100 text-gray-800',
};

export function DocumentGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDocuments = DOCUMENTS.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'all' || doc.category === selectedCategory)
  );

  // Sort documents based on current sort settings
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const fieldA = a[sortField as keyof typeof a];
    const fieldB = b[sortField as keyof typeof b];
    
    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Catégories</SelectLabel>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                <SelectItem value="Physique">Physique</SelectItem>
                <SelectItem value="Littérature">Littérature</SelectItem>
                <SelectItem value="Informatique">Informatique</SelectItem>
                <SelectItem value="Histoire">Histoire</SelectItem>
                <SelectItem value="Biologie">Biologie</SelectItem>
                <SelectItem value="Philosophie">Philosophie</SelectItem>
                <SelectItem value="Géographie">Géographie</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortField('title')}>
                Titre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField('category')}>
                Catégorie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField('uploadDate')}>
                Date d'importation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Documents grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedDocuments.map((doc) => (
          <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/documents/${doc.id}`}>
              <CardContent className="p-0">
                <div className="h-36 bg-secondary/30 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate" title={doc.title}>
                    {doc.title}
                  </h3>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <FolderIcon className="h-3.5 w-3.5 mr-1" />
                    {doc.category}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                </div>
                <Badge 
                  variant="secondary"
                  className={cn("font-normal", typeColorMap[doc.type] || "")}
                >
                  {doc.type}
                </Badge>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
      
      {/* Empty state */}
      {sortedDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">Aucun document trouvé</h3>
          <p className="text-muted-foreground mt-1">
            Essayez de modifier vos filtres ou d'importer de nouveaux documents.
          </p>
        </div>
      )}
    </div>
  );
}
