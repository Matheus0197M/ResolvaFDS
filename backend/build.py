import hashlib
import json
from pathlib import Path

from content import RAIZ, carregar_categorias, carregar_tutoriais, resumo

SAIDA = RAIZ / "public" / "data"


def escrever(nome: str, dados) -> None:
    destino = SAIDA / nome
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main() -> None:
    categorias = carregar_categorias()
    tutoriais = carregar_tutoriais(categorias)
    versao = hashlib.sha256(
        json.dumps(tutoriais, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()[:10]

    escrever("index.json", {
        "versao": versao,
        "categorias": categorias,
        "tutoriais": [resumo(t) for t in tutoriais],
    })
    for t in tutoriais:
        escrever(f"tutoriais/{t['slug']}.json", t)
    print(f"{len(tutoriais)} tutoriais gerados (versão {versao})")


if __name__ == "__main__":
    main()