from sentence_transformers import SentenceTransformer
from annoy import AnnoyIndex
model = SentenceTransformer('cointegrated/rubert-tiny2')

trees = 10
neighbours = 5

sentences = ["привет мир", "hello world", "здравствуй вселенная", "hello world!", "шоколадка", "земля", "боулинг", "капча", "дом", "кров",
             "шоколад", "мяч", "шоколадный", "ночлег", "крыша", "стена"]
annoy = AnnoyIndex(312, 'angular')

embeddings = model.encode(sentences)

for i in range(len(sentences)):
    annoy.add_item(i, embeddings[i])

annoy.build(trees)

for i in annoy.get_nns_by_vector(embeddings[8], neighbours):
    print(sentences[i])