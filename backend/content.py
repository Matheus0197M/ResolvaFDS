import re
from pathlib import Path
import yaml

RAIZ = Path(__file__).resolve().parent.parent
CONTEUDO = RAIZ / "content"
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
OBRIGATORIOS = {"slug", "titulo", "categoria", "resumo", "passos"}
CAMPOS_INDICE = ("slug", "titulo", "categoria", "resumo",
                 "dificuldade", "tempo_min", "tags", "sinonimos")


def _ler(caminho: Path):
    return yaml.safe_load(caminho.read_text(encoding="utf-8"))


def carregar_categorias() -> list[dict]:
    return _ler(CONTEUDO / "categorias.yaml")


def _validar(t: dict, caminho: Path, categorias: set[str]) -> None:
    faltando = OBRIGATORIOS - t.keys()
    if faltando:
        raise ValueError(f"{caminho.name}: campos ausentes {sorted(faltando)}")
    if t["slug"] != caminho.stem or not SLUG.match(t["slug"]):
        raise ValueError(f"{caminho.name}: slug inválido ou diferente do arquivo")
    if t["categoria"] not in categorias:
        raise ValueError(f"{caminho.name}: categoria desconhecida '{t['categoria']}'")
    # for v in t.get("videos", []):
    #     if not re.fullmatch(r"[\w-]{11}", v["id"]):
    #         raise ValueError(f"{caminho.name}: id de vídeo inválido '{v['id']}'")


def carregar_tutoriais(categorias: list[dict]) -> list[dict]:
    ids = {c["id"] for c in categorias}
    tutoriais = []
    for caminho in sorted((CONTEUDO / "tutoriais").glob("*.yaml")):
        t = _ler(caminho)
        _validar(t, caminho, ids)
        tutoriais.append(t)
    return tutoriais


def resumo(t: dict) -> dict:
    """Versão leve para o índice/busca."""
    return {k: t.get(k) for k in CAMPOS_INDICE}


def obter_tutorial(slug: str) -> dict | None:
    """Reaproveitável pela API futura (FastAPI/Flask)."""
    cats = carregar_categorias()
    return next((t for t in carregar_tutoriais(cats) if t["slug"] == slug), None)