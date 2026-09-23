import asyncio
import sys
from app.p2p.relay_server import main as relay_main
from app.p2p.node import run_cli_node


def run_relay():
    """CLI entrypoint for launching Ubuntu Relay/STUN server."""
    relay_main()


def run_node():
    """CLI entrypoint for launching P2P Node client."""
    asyncio.run(run_cli_node())
