
  // Mutation to save generated summary as a new document
  const saveSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSummary || !userData?.id) {
        throw new Error("Informations manquantes pour l'enregistrement");
      }

      let documentName = "Résumé généré";
      
      if (inputMethod === 'select' && selectedDocumentId) {
        const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
        if (selectedDocument) {
          documentName = `${selectedDocument.nom} - Résumé`;
        }
      } else if (uploadedFile) {
        documentName = `${uploadedFile.name} - Résumé`;
      }
      
      // Ensure we have a valid category ID (or null)
      const categoryId = selectedCategoryId === "no-category" ? null : selectedCategoryId || null;
      
      // S'assurer que content est bien inséré dans la base de données
      const { data, error } = await supabase
        .from("documents")
        .insert({
          nom: documentName,
          user_id: userData.id,
          category_id: categoryId,
          content: generatedSummary,
          is_shared: false,
          url: null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      toast.success("Résumé enregistré avec succès !");
      setSelectedCategoryId("");
    },
    onError: (error) => {
      console.error("Error saving summary:", error);
      toast.error("Erreur lors de l'enregistrement du résumé");
    }
  });
